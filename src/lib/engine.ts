import * as Tone from 'tone'
import type { HandFilter, SongDoc } from '@/types/song'
import { usePlayer } from './store'
import { ensureAudioRunning } from './audio-unlock'
import { buildEvents, countInClicks, isDownbeat, type EngineEvent } from './engine-events'
import { INSTRUMENTS, type InstrumentId } from './instruments'

// ── Instrument nodes (lazy, self-hosted samples) ─────────────────────────────
// Every instrument in the register (piano/guitar/bass/drums) becomes at most one
// Tone node here, built on first use from public/samples/<instrument>/ (see
// instruments.ts). Pitched instruments are Tone.Sampler (pitch-shifting);
// drums are Tone.Players (one one-shot per GM pitch, NEVER pitch-shifted).

export interface BuildOptions {
  hand: HandFilter
  bpm: number
  loop: boolean
  /** Semitone offset applied to every pitch at build time. Transposition is a
   * PURE number transform (no repitch artefacts) — the UI computes this from the
   * song's original_key and the store's targetKey (nearest path) and passes it
   * in, keeping the engine dependent on nothing but the SongDoc + the offset. */
  transpose?: number
  swing?: number // 0 = straight, ~0.5 = jazz swing (Tone.Transport.swing)
  /** Play the non-selected hand at this velocity instead of muting it (per-hand
   * / band practice). Undefined = the muted hand is silent. */
  mutedHandVelocity?: number
  /** Extra generated accompaniment tracks (bass/drums/…) scheduled alongside the
   * piano score. Each gets its own Tone.Part + per-instrument Volume node, so
   * the band mixer can mute/level a track live without a rebuild. */
  extraTracks?: TrackInput[]
}

/** One additional instrument track passed to build() (band mode). Events are
 * already-flattened sounding events (beats/pitch/dur/vel). For drums, `pitch`
 * is the GM percussion number (identity, not a frequency). */
export interface TrackInput {
  instrument: InstrumentId
  events: EngineEvent[]
  /** Initial mixer level for this track, in dB (0 = unity). */
  volumeDb?: number
}

/** Internal shape a Tone.Part callback receives (beats already → ticks). */
interface PartEvent {
  time: string
  midi: number
  durTicks: string
  vel: number
}

type BeatListener = (beat: number) => void

/**
 * Single global playback engine for a whole song. Everything is scheduled on
 * Tone.Transport in TICKS (tempo-independent), so BPM can change live without
 * restarting or repitching. Rebuilding is only needed when the key/hand/muting
 * changes. `currentBeat` (written to the store and pushed to onBeat listeners)
 * is the ONE time source every UI layer derives from.
 */
export class SongEngine {
  /** One audio node per instrument, built lazily from the register. */
  private nodes = new Map<InstrumentId, Tone.Sampler | Tone.Players>()
  /** One mixer (Volume) node per instrument, for live mute/level (band mode). */
  private volumes = new Map<InstrumentId, Tone.Volume>()
  /** One Tone.Part per active track (piano + any extra tracks). */
  private parts: Tone.Part[] = []
  /** Which instruments the current build() actually schedules (ensured on play). */
  private usedInstruments = new Set<InstrumentId>()
  private raf: number | null = null
  private totalBeats = 0
  private beatsPerBar = 4
  private pickupBeats = 0
  private endEvent: number | null = null
  private metro: Tone.MembraneSynth | null = null
  private metroId: number | null = null
  private loopStartBeat = 0
  private loopEndBeat: number | null = null // null = full length
  private beatListeners = new Set<BeatListener>()

  private ensureMetro(): Tone.MembraneSynth {
    if (!this.metro) {
      this.metro = new Tone.MembraneSynth({
        octaves: 1.5,
        pitchDecay: 0.008,
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
      }).toDestination()
      this.metro.volume.value = -6
    }
    return this.metro
  }

  private click(time: number, accent: boolean) {
    this.ensureMetro().triggerAttackRelease(accent ? 'C6' : 'G5', '32n', time, accent ? 0.9 : 0.5)
  }

  /** The per-instrument mixer node (created on demand). */
  private ensureVolume(id: InstrumentId): Tone.Volume {
    let v = this.volumes.get(id)
    if (!v) {
      v = new Tone.Volume(0).toDestination()
      this.volumes.set(id, v)
    }
    return v
  }

  /** Lazily build (and load) an instrument's node, routed through its mixer. */
  private async ensureInstrument(id: InstrumentId): Promise<Tone.Sampler | Tone.Players> {
    const existing = this.nodes.get(id)
    if (existing) return existing
    usePlayer.getState().set({ isLoading: true })
    const spec = INSTRUMENTS[id]
    const vol = this.ensureVolume(id)
    let node: Tone.Sampler | Tone.Players
    if (spec.kind === 'sampler') {
      node = new Tone.Sampler({
        urls: spec.urls,
        baseUrl: spec.baseUrl,
        release: spec.release,
      }).connect(vol)
    } else {
      // Tone.Players keys are strings; the register keys drums by GM number.
      const urls: Record<string, string> = {}
      for (const [pitch, file] of Object.entries(spec.urls)) urls[pitch] = file
      node = new Tone.Players({ urls, baseUrl: spec.baseUrl }).connect(vol)
    }
    this.nodes.set(id, node)
    await Tone.loaded()
    usePlayer.getState().set({ isLoading: false })
    return node
  }

  /**
   * Trigger one scheduled event on an instrument. Pitched (sampler) instruments
   * play a pitch-shifted note; drums (players) start the one-shot named by the
   * GM pitch — NEVER pitch-shifted or transposed (the pitch is only an identity).
   */
  private triggerEvent(id: InstrumentId, midi: number, durTicks: string, time: number, vel: number) {
    const node = this.nodes.get(id)
    if (!node) return
    if (node instanceof Tone.Players) {
      const key = String(midi)
      if (!node.has(key)) return
      const p = node.player(key)
      p.volume.value = Tone.gainToDb(Math.max(0.0001, Math.min(1, vel)))
      p.start(time)
    } else {
      node.triggerAttackRelease(Tone.Frequency(midi, 'midi').toFrequency(), durTicks, time, vel)
    }
  }

  /** Live mixer level for a track (band mode) — no rebuild. */
  setTrackVolume(id: InstrumentId, db: number) {
    this.ensureVolume(id).volume.value = db
  }

  /** Live mute/unmute for a track (band mode) — no rebuild. */
  muteTrack(id: InstrumentId, muted: boolean) {
    this.ensureVolume(id).mute = muted
  }

  private beatToTicks = (beat: number) => Math.round(beat * Tone.Transport.PPQ) + 'i'

  /** Schedule one Tone.Part for a track and remember its instrument. */
  private addPart(id: InstrumentId, events: PartEvent[]) {
    this.usedInstruments.add(id)
    const part = new Tone.Part<PartEvent>((time, ev) => {
      this.triggerEvent(id, ev.midi, ev.durTicks, time, ev.vel)
    }, events)
    part.start(0)
    this.parts.push(part)
  }

  /** Convert flat sounding events (beats) into scheduled Part events (ticks). */
  private toPartEvents(events: EngineEvent[]): PartEvent[] {
    return events.map((ev) => ({
      time: this.beatToTicks(ev.beat),
      midi: ev.pitch,
      durTicks: this.beatToTicks(ev.durBeats),
      vel: ev.vel,
    }))
  }

  /** (Re)build the Tone.Parts for a whole song in the given key/hand/tempo. The
   * piano score is the main track; `opts.extraTracks` add generated bass/drums
   * (band mode). */
  build(doc: SongDoc, opts: BuildOptions) {
    // Dispose any prior parts before replacing.
    for (const p of this.parts) p.dispose()
    this.parts = []
    this.usedInstruments = new Set<InstrumentId>()

    // Main piano track: tie pairs merged into single sounding notes; the hand
    // filter (and optional muted-hand velocity) and transposition applied here.
    const mainEvents = buildEvents(doc, {
      hand: opts.hand,
      transpose: opts.transpose,
      mutedHandVelocity: opts.mutedHandVelocity,
    })
    this.addPart('piano', this.toPartEvents(mainEvents))

    // Generated accompaniment tracks (band mode). Drums carry GM-pitch identity
    // and are never transposed; extra tracks are pre-flattened by the caller.
    for (const track of opts.extraTracks ?? []) {
      this.addPart(track.instrument, this.toPartEvents(track.events))
      if (track.volumeDb !== undefined) this.setTrackVolume(track.instrument, track.volumeDb)
    }

    this.totalBeats = doc.totalBeats
    this.beatsPerBar = doc.beatsPerBar
    this.pickupBeats = doc.pickupBeats

    Tone.Transport.bpm.value = opts.bpm
    Tone.Transport.swing = opts.swing ?? 0
    Tone.Transport.swingSubdivision = '8n'
    Tone.Transport.loop = opts.loop
    this.applyLoopRange()
    this.scheduleEnd(opts.loop)
  }

  private applyLoopRange() {
    const end =
      this.loopEndBeat === null ? this.totalBeats : Math.min(this.loopEndBeat, this.totalBeats)
    Tone.Transport.loopStart = this.beatToTicks(Math.max(0, this.loopStartBeat))
    Tone.Transport.loopEnd = this.beatToTicks(end)
  }

  /** A-B / per-section loop: pass (null, null) to reset to the whole song. */
  setLoopRange(startBeat: number | null, endBeat: number | null) {
    this.loopStartBeat = startBeat ?? 0
    this.loopEndBeat = endBeat
    this.applyLoopRange()
  }

  setSwing(v: number) {
    Tone.Transport.swing = v
  }

  // When not looping, stop cleanly at the end of the song.
  private scheduleEnd(loop: boolean) {
    if (this.endEvent !== null) {
      Tone.Transport.clear(this.endEvent)
      this.endEvent = null
    }
    if (!loop) {
      this.endEvent = Tone.Transport.scheduleOnce(() => {
        Tone.Draw.schedule(() => this.stop(), Tone.now())
      }, this.beatToTicks(this.totalBeats))
    }
  }

  setLoop(loop: boolean) {
    Tone.Transport.loop = loop
    this.scheduleEnd(loop)
  }

  /** Live tempo change — no restart, no repitch. */
  setTempo(bpm: number) {
    Tone.Transport.bpm.value = bpm
  }

  /**
   * Jump to `beat` (Transport ticks-offset). Works both while stopped and
   * during playback — setting Transport.ticks reseeks a running transport.
   */
  seekTo(beat: number) {
    Tone.Transport.ticks = Math.max(0, Math.round(beat * Tone.Transport.PPQ))
    const b = this.totalBeats > 0 ? beat % this.totalBeats : beat
    usePlayer.getState().set({ currentBeat: b })
    this.beatListeners.forEach((cb) => cb(b))
  }

  /** Subscribe to the beat clock (tick-driven). Returns an unsubscribe fn. */
  onBeat(cb: BeatListener): () => void {
    this.beatListeners.add(cb)
    return () => this.beatListeners.delete(cb)
  }

  /** Trigger a single note now (on-screen keyboard / MIDI feedback, wait-mode).
   * For drums, `midi` is the GM percussion pitch (never repitched). */
  async playNote(midi: number, velocity = 0.8, durationSec = 0.6, instrument: InstrumentId = 'piano') {
    await ensureAudioRunning()
    const node = await this.ensureInstrument(instrument)
    await ensureAudioRunning() // context can suspend during the async sample load (iOS)
    if (node instanceof Tone.Players) {
      const key = String(midi)
      if (!node.has(key)) return
      const p = node.player(key)
      p.volume.value = Tone.gainToDb(Math.max(0.0001, Math.min(1, velocity)))
      p.start()
    } else {
      node.triggerAttackRelease(Tone.Frequency(midi, 'midi').toFrequency(), durationSec, undefined, velocity)
    }
  }

  async play() {
    await ensureAudioRunning()
    // Load every instrument the current build scheduled (piano + extra tracks).
    for (const id of this.usedInstruments) await this.ensureInstrument(id)
    await ensureAudioRunning() // re-resume after the async load — iOS Safari suspends

    // Optional one-bar count-in before the transport starts. When looping from a
    // mid-song A-point the opptakt doesn't apply, so treat pickup as 0 there.
    const now = Tone.now()
    const spb = 60 / Tone.Transport.bpm.value
    let startTime = now
    if (usePlayer.getState().countIn) {
      const pickup = this.loopStartBeat > 0 ? 0 : this.pickupBeats
      const { clicks, startAfterBeats } = countInClicks(this.beatsPerBar, pickup)
      for (const c of clicks) this.click(now + c.beat * spb, c.accent)
      startTime = now + startAfterBeats * spb
    }

    // Metronome: one scheduled repeat, gated live on the store flag so toggling
    // during playback takes effect immediately. Accent the bar downbeat
    // (respecting the pickup).
    if (this.metroId !== null) Tone.Transport.clear(this.metroId)
    this.metroId = Tone.Transport.scheduleRepeat((time) => {
      if (!usePlayer.getState().metronome) return
      const beat = Math.round(Tone.Transport.getTicksAtTime(time) / Tone.Transport.PPQ)
      this.click(time, isDownbeat(beat, this.beatsPerBar, this.pickupBeats))
    }, '4n', 0)

    // Start at the A point when a section loop is active.
    const offsetTicks = Math.round(this.loopStartBeat * Tone.Transport.PPQ)
    Tone.Transport.start(startTime, `${offsetTicks}i`)
    usePlayer.getState().set({ isPlaying: true })
    this.tick()
  }

  stop() {
    Tone.Transport.stop()
    Tone.Transport.position = 0
    if (this.metroId !== null) {
      Tone.Transport.clear(this.metroId)
      this.metroId = null
    }
    if (this.raf !== null) cancelAnimationFrame(this.raf)
    this.raf = null
    usePlayer.getState().set({ isPlaying: false, currentBeat: 0 })
    this.beatListeners.forEach((cb) => cb(0))
  }

  private tick = () => {
    const PPQ = Tone.Transport.PPQ
    const beat = this.totalBeats > 0 ? (Tone.Transport.ticks / PPQ) % this.totalBeats : 0
    usePlayer.getState().set({ currentBeat: beat })
    this.beatListeners.forEach((cb) => cb(beat))
    this.raf = requestAnimationFrame(this.tick)
  }

  /** Tear down (route change). */
  dispose() {
    this.stop()
    for (const p of this.parts) p.dispose()
    this.parts = []
    for (const node of this.nodes.values()) node.dispose()
    this.nodes.clear()
    for (const vol of this.volumes.values()) vol.dispose()
    this.volumes.clear()
    this.usedInstruments.clear()
    this.metro?.dispose()
    this.metro = null
    this.beatListeners.clear()
  }
}

// Singleton — one AudioContext / sampler for the whole app.
let engine: SongEngine | null = null
export function getEngine(): SongEngine {
  if (!engine) engine = new SongEngine()
  return engine
}
