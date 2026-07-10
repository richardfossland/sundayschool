import * as Tone from 'tone'
import type { HandFilter, SongDoc } from '@/types/song'
import { usePlayer } from './store'
import { ensureAudioRunning } from './audio-unlock'
import { buildEvents, countInClicks, isDownbeat } from './engine-events'

// ── Salamander piano sampler (lazy) ──────────────────────────────────────────
// A subset of the Salamander Grand samples (every minor-3rd, A0–C8) hosted on
// the Tone.js CDN; Tone.Sampler pitch-shifts between them. Loads on first play.
const SALAMANDER_BASE = 'https://tonejs.github.io/audio/salamander/'

function buildSampleMap(): Record<string, string> {
  const roots = ['A', 'C', 'D#', 'F#']
  const map: Record<string, string> = {}
  for (let octave = 0; octave <= 7; octave++) {
    for (const r of roots) {
      // A0 is the lowest sample; C8 the highest.
      if (octave === 0 && (r === 'C' || r === 'D#' || r === 'F#')) continue
      const note = `${r}${octave}`
      const file = `${r.replace('#', 's')}${octave}.mp3`
      map[note] = file
    }
  }
  map['C8'] = 'C8.mp3'
  return map
}

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
  private sampler: Tone.Sampler | null = null
  private part: Tone.Part | null = null
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

  private async ensureSampler(): Promise<Tone.Sampler> {
    if (this.sampler) return this.sampler
    usePlayer.getState().set({ isLoading: true })
    const sampler = new Tone.Sampler({
      urls: buildSampleMap(),
      baseUrl: SALAMANDER_BASE,
      release: 1,
    }).toDestination()
    await Tone.loaded()
    this.sampler = sampler
    usePlayer.getState().set({ isLoading: false })
    return sampler
  }

  private beatToTicks = (beat: number) => Math.round(beat * Tone.Transport.PPQ) + 'i'

  /** (Re)build the Tone.Part for a whole song in the given key/hand/tempo. */
  build(doc: SongDoc, opts: BuildOptions) {
    // Dispose any prior part before replacing.
    this.part?.dispose()

    // Tie pairs are merged into single sounding notes; the hand filter (and
    // optional muted-hand velocity) and transposition are applied here.
    const events = buildEvents(doc, {
      hand: opts.hand,
      transpose: opts.transpose,
      mutedHandVelocity: opts.mutedHandVelocity,
    }).map((ev) => ({
      time: this.beatToTicks(ev.beat),
      midi: ev.pitch,
      durTicks: this.beatToTicks(ev.durBeats),
      vel: ev.vel,
    }))

    const part = new Tone.Part((time, ev) => {
      const freq = Tone.Frequency(ev.midi, 'midi').toFrequency()
      this.sampler?.triggerAttackRelease(freq, ev.durTicks, time, ev.vel)
    }, events)
    part.start(0)

    this.part = part
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

  /** Trigger a single note now (on-screen keyboard / MIDI feedback, wait-mode). */
  async playNote(midi: number, velocity = 0.8, durationSec = 0.6) {
    await ensureAudioRunning()
    const sampler = await this.ensureSampler()
    await ensureAudioRunning() // context can suspend during the async sampler load (iOS)
    sampler.triggerAttackRelease(
      Tone.Frequency(midi, 'midi').toFrequency(),
      durationSec,
      undefined,
      velocity,
    )
  }

  async play() {
    await ensureAudioRunning()
    await this.ensureSampler()
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
    this.part?.dispose()
    this.part = null
    this.beatListeners.clear()
  }
}

// Singleton — one AudioContext / sampler for the whole app.
let engine: SongEngine | null = null
export function getEngine(): SongEngine {
  if (!engine) engine = new SongEngine()
  return engine
}
