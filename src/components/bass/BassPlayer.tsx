'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plug } from 'lucide-react'
import type { Song, SongNote } from '@/types/song'
import { usePlayer } from '@/lib/store'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { nearestOffset, transposeDoc } from '@/lib/transpose'
import { sectionOf } from '@/lib/song/sections'
import { recordPractice } from '@/lib/progress'
import { connectMidi, midiSupported, type MidiConnection } from '@/lib/midi'
import { useWaitMode } from '@/lib/useWaitMode'
import { generateBassline, type BassLevel } from '@/lib/bass/bassline'
import { bandTracks, applyBandMix } from '@/lib/band'
import { BASS_EADG, bestPosition, type FretPosition } from '@/lib/fretboard-geometry'
import type { FretLaneNote } from '@/lib/fretboard-renderer'
import { noteName } from '@/lib/music'
import { ChordStrip } from '../ChordStrip'
import { SectionNav } from '../SectionNav'
import { TransportBar } from '../TransportBar'
import { BandPanel } from '../BandPanel'
import { FallingFretboard } from './FallingFretboard'
import { Fretboard } from './Fretboard'
import { LevelPicker } from './LevelPicker'

// ── BassPlayer — the bass fag's orchestrator ─────────────────────────────────
// The bass sibling of SongPlayer.tsx (the fasit — NOT modified): same engine
// lifecycle, MIDI wiring, wait-mode and store-driven time source, but the score
// is a GENERATED bassline from the song's chord track (three levels) instead of
// the piano notes. Playback runs through engine extraTracks with the bass
// sampler; the piano main track is given an EMPTY note list and its mixer
// channel is muted, so wait-mode's internal piano feedback notes stay silent
// and the local input wrapper sounds the bass sample instead.

const EPS = 1e-6
const STRING_LABELS = BASS_EADG.map((m) => noteName(m).replace(/\d+$/, '')) // E A D G

interface Props {
  song: Song
}

export function BassPlayer({ song }: Props) {
  const isPlaying = usePlayer((s) => s.isPlaying)
  const isLoading = usePlayer((s) => s.isLoading)
  const currentBeat = usePlayer((s) => s.currentBeat)
  const bpm = usePlayer((s) => s.bpm)
  const targetKey = usePlayer((s) => s.targetKey)
  const loop = usePlayer((s) => s.loop)
  const waitMode = usePlayer((s) => s.waitMode)
  const metronome = usePlayer((s) => s.metronome)
  const countIn = usePlayer((s) => s.countIn)
  const bandMode = usePlayer((s) => s.bandMode)

  const [midi, setMidi] = useState<MidiConnection | null>(null)
  const [midiError, setMidiError] = useState<string | null>(null)
  const [level, setLevel] = useState<BassLevel>(1)

  // Transposition is the same pure transform as the piano player: nearest-path
  // offset → transposed doc; the bassline is generated FROM the transposed
  // chords, so key changes re-generate rather than repitch.
  const offset = useMemo(() => nearestOffset(song.original_key, targetKey), [song.original_key, targetKey])
  const doc = useMemo(() => transposeDoc(song.doc, offset), [song.doc, offset])

  // The generated bass part (engine events) and its fretboard positions with
  // position continuity: each note is placed near the previous one.
  const bassline = useMemo(() => generateBassline(doc.chords, doc, level), [doc, level])
  const positions = useMemo<FretLaneNote[]>(() => {
    const out: FretLaneNote[] = []
    let prev: FretPosition | undefined
    for (const ev of bassline) {
      const pos = bestPosition(ev.pitch, BASS_EADG, prev)
      if (!pos) continue // out of neck range — never for generated lines
      prev = pos
      out.push({ beat: ev.beat, durBeats: ev.durBeats, string: pos.string, fret: pos.fret })
    }
    return out
  }, [bassline])

  // The bassline as SongNotes so wait-mode can gate on it (all one "hand").
  const bassNotes = useMemo<SongNote[]>(
    () => bassline.map((ev) => ({ p: ev.pitch, t: ev.beat, d: ev.durBeats, h: 'L' as const })),
    [bassline],
  )

  // Live values the rebuild effect reads without re-triggering on their change.
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const loopRef = useRef(loop)
  loopRef.current = loop

  // Subject-prefixed progress key (Skolen v2 — all keys are `{fag}:{slug}`).
  const progressKey = `bass:${song.slug}`

  const activeSection = useMemo(() => sectionOf(doc, currentBeat), [doc, currentBeat])

  // Reset transport controls to the song's defaults when the song changes.
  useEffect(() => {
    const st = usePlayer.getState()
    st.set({
      targetKey: song.original_key,
      bpm: song.default_bpm,
      hand: 'both',
      loop: null,
      waitMode: false,
      activeSectionId: null,
      currentBeat: 0,
    })
  }, [song.slug, song.original_key, song.default_bpm])

  useEffect(() => {
    installAudioUnlock()
    return () => getEngine().dispose()
  }, [])

  // (Re)build when the generated line changes (key, level, or band). Solo mode:
  // the piano main track is empty and muted, and only the generated bass extra
  // track sounds (the reference line). Band-modus: the learner plays the bass, so
  // the app plays piano+drums instead (bandTracks excludes bass) and piano is
  // unmuted — the generated bassline stays on the fretboard as the visual target.
  useEffect(() => {
    const engine = getEngine()
    const wasPlaying = usePlayer.getState().isPlaying
    if (wasPlaying) engine.stop()
    engine.build(
      { ...doc, notes: [] },
      {
        hand: 'both',
        bpm: bpmRef.current,
        loop: loopRef.current !== null,
        transpose: 0, // doc is already transposed
        extraTracks: bandMode
          ? bandTracks(doc, { exclude: 'bass', bpm: song.default_bpm })
          : [{ instrument: 'bass', events: bassline }],
      },
    )
    engine.muteTrack('piano', !bandMode) // solo: silence internal piano; band: piano plays
    if (bandMode) applyBandMix(engine, usePlayer.getState().bandMix)
    const lp = loopRef.current
    engine.setLoopRange(lp ? lp[0] : null, lp ? lp[1] : null)
    if (wasPlaying) void engine.play()
  }, [doc, bassline, bandMode, song.default_bpm])

  // Keep the engine's loop range in sync with the UI (live, no rebuild).
  useEffect(() => {
    const engine = getEngine()
    engine.setLoop(loop !== null)
    engine.setLoopRange(loop ? loop[0] : null, loop ? loop[1] : null)
  }, [loop])

  // Wait-mode over the generated bassline (MIDI or fretboard clicks). The
  // shared hook sounds its feedback on the (muted) piano channel; the input
  // wrapper below plays the bass sample, so what you hear is a bass.
  const waitRange: [number, number] | null = activeSection
    ? [activeSection.startBeat, activeSection.endBeat]
    : loop
  const onWaitLoop = useCallback(
    () => recordPractice(progressKey, bpmRef.current, activeSection?.id),
    [progressKey, activeSection],
  )
  const wait = useWaitMode(bassNotes, { range: waitRange, hand: 'both', onLoopComplete: onWaitLoop })
  const waitInputRef = useRef(wait.input)
  waitInputRef.current = wait.input

  // Local input wrapper: always sound the bass sample, then feed the trainer.
  const input = useCallback((midiPitch: number) => {
    void getEngine().playNote(midiPitch, 0.85, 0.7, 'bass')
    waitInputRef.current(midiPitch)
  }, [])
  const inputRef = useRef(input)
  inputRef.current = input

  // Enter/leave wait-mode: stop the transport on enter, reset on leave.
  useEffect(() => {
    if (waitMode) {
      getEngine().stop()
      wait.start()
    } else {
      wait.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitMode])

  // Record a completed pass when the loop wraps back during playback.
  const prevBeatRef = useRef(0)
  useEffect(() => {
    if (!isPlaying) {
      prevBeatRef.current = currentBeat
      return
    }
    if (currentBeat < prevBeatRef.current - 0.5) {
      recordPractice(progressKey, bpmRef.current)
    }
    prevBeatRef.current = currentBeat
  }, [currentBeat, isPlaying, progressKey])

  useEffect(() => () => midi?.dispose(), [midi])

  const onPlayToggle = () => {
    const engine = getEngine()
    if (usePlayer.getState().isPlaying) {
      engine.stop()
      recordPractice(progressKey, usePlayer.getState().bpm, usePlayer.getState().activeSectionId ?? undefined)
    } else {
      if (usePlayer.getState().waitMode) usePlayer.getState().setWaitMode(false)
      void engine.play()
    }
  }
  const onBpm = (v: number) => {
    usePlayer.getState().setBpm(v)
    getEngine().setTempo(v)
  }
  const onLoopToggle = () => {
    const cur = usePlayer.getState().loop
    usePlayer.getState().setLoop(cur ? null : [0, doc.totalBeats])
  }
  const onSelectSection = (s: { id: string; startBeat: number }) => {
    getEngine().seekTo(s.startBeat)
    usePlayer.getState().setActiveSection(s.id)
  }
  const onLoopSection = (s: { startBeat: number; endBeat: number }) => {
    const cur = usePlayer.getState().loop
    const same = cur && Math.abs(cur[0] - s.startBeat) < EPS && Math.abs(cur[1] - s.endBeat) < EPS
    usePlayer.getState().setLoop(same ? null : [s.startBeat, s.endBeat])
  }

  const onConnectMidi = async () => {
    setMidiError(null)
    try {
      const conn = await connectMidi({
        onNoteOn: (pitch) => inputRef.current(pitch),
        onNoteOff: () => {},
      })
      if (!conn) setMidiError('MIDI støttes ikke her — bruk Chrome/Edge, eller klikk gripebrettet.')
      else setMidi(conn)
    } catch (e) {
      setMidiError(e instanceof Error ? e.message : 'Kunne ikke koble til MIDI.')
    }
  }

  // Fretboard state: sounding positions during playback; expected positions in
  // wait-mode (the generated positions at the frozen step beat).
  const activePositions = useMemo<FretPosition[]>(() => {
    if (waitMode || !isPlaying) return []
    return positions
      .filter((n) => n.beat - EPS <= currentBeat && currentBeat < n.beat + n.durBeats - EPS)
      .map((n) => ({ string: n.string, fret: n.fret }))
  }, [positions, currentBeat, isPlaying, waitMode])

  const expectedPositions = useMemo<FretPosition[]>(() => {
    if (!waitMode || wait.currentStepBeat == null) return []
    return positions
      .filter((n) => Math.abs(n.beat - wait.currentStepBeat!) < 1e-3)
      .map((n) => ({ string: n.string, fret: n.fret }))
  }, [positions, waitMode, wait.currentStepBeat])

  const stripBeat = waitMode ? (wait.currentStepBeat ?? 0) : currentBeat

  return (
    <div className="flex flex-col gap-4">
      {/* MIDI status */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-muted)]">
          {midi ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-sea)]">
              <Plug className="h-4 w-4" /> {midi.deviceNames[0] ?? 'MIDI tilkoblet'}
            </span>
          ) : (
            'Klikk gripebrettet — eller koble til en MIDI-bass/-keyboard'
          )}
        </span>
        {midiSupported() && !midi && (
          <button
            onClick={onConnectMidi}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
          >
            <Plug className="h-4 w-4" /> Koble til MIDI
          </button>
        )}
      </div>
      {midiError && <p className="text-xs text-[var(--color-danger)]">{midiError}</p>}

      {/* Falling lanes + fretboard in one panel (vertical stack — 4 lanes fit
          any width, so no shared horizontal scroll is needed here). */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
        <FallingFretboard
          notes={positions}
          laneCount={BASS_EADG.length}
          stringLabels={STRING_LABELS}
          waitBeat={waitMode ? wait.currentStepBeat : null}
          beatOverride={waitMode ? wait.currentStepBeat : null}
        />
        <Fretboard
          onPress={(m) => inputRef.current(m)}
          expected={expectedPositions}
          feedback={waitMode ? wait.feedback : undefined}
          active={activePositions}
        />
      </div>

      <ChordStrip chords={doc.chords} keySignature={doc.keySignature} currentBeat={stripBeat} />

      <SectionNav
        sections={doc.sections}
        currentBeat={stripBeat}
        loop={loop}
        onSelect={onSelectSection}
        onLoop={onLoopSection}
      />

      {/* Bassline level (which generated line to practice). */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <LevelPicker level={level} onLevel={setLevel} />
      </div>

      {/* Shared transport. The hand filter has no meaning for a generated
          one-voice bassline, so it is fixed at 'both' and the buttons are inert. */}
      <TransportBar
        isPlaying={isPlaying}
        isLoading={isLoading}
        onPlayToggle={onPlayToggle}
        bpm={bpm}
        defaultBpm={song.default_bpm}
        onBpm={onBpm}
        targetKey={targetKey}
        onKey={(k) => usePlayer.getState().setTargetKey(k)}
        hand="both"
        onHand={() => {}}
        metronome={metronome}
        onMetronomeToggle={() => usePlayer.getState().toggleMetronome()}
        countIn={countIn}
        onCountInToggle={() => usePlayer.getState().toggleCountIn()}
        waitMode={waitMode}
        onWaitToggle={() => usePlayer.getState().setWaitMode(!usePlayer.getState().waitMode)}
        loop={loop !== null}
        onLoopToggle={onLoopToggle}
      />

      <BandPanel own="bass" />

      {waitMode && (
        <p className="text-sm text-[var(--color-muted)]">
          Spill de <span className="text-[var(--color-amber)]">markerte</span> posisjonene i rekkefølge
          {wait.total > 0 && (
            <>
              {' — '}
              <span className="font-display text-[var(--color-ivory)]">
                trinn {wait.step + 1} / {wait.total}
              </span>
            </>
          )}
          . Grønt = riktig, rødt = bom. Bruk MIDI eller klikk gripebrettet.
        </p>
      )}
    </div>
  )
}
