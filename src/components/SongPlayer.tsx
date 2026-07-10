'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plug } from 'lucide-react'
import type { Song, HandFilter } from '@/types/song'
import { usePlayer } from '@/lib/store'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { nearestOffset, transposeDoc } from '@/lib/transpose'
import { sectionOf } from '@/lib/song/sections'
import { recordPractice } from '@/lib/progress'
import { connectMidi, midiSupported, type MidiConnection } from '@/lib/midi'
import { useWaitMode } from '@/lib/useWaitMode'
import { FallingNotes } from './FallingNotes'
import { Keyboard } from './Keyboard'
import { ChordStrip } from './ChordStrip'
import { SectionNav } from './SectionNav'
import { TransportBar } from './TransportBar'
import { keyboardLayout, padToC } from '@/lib/keyboard-geometry'

// ── SongPlayer — the orchestrator ────────────────────────────────────────────
// Owns the engine lifecycle, MIDI, wait-mode wiring and layout. Everything is
// derived from the store's `currentBeat`, so audio and visuals stay in lock-step.
// Fasit: SundayLicks' Practice.tsx, adapted from short licks to full songs.

const LOW_MIDI = 36 // C2
const HIGH_MIDI = 96 // C7
const WHITE_KEY_WIDTH = 34

interface Props {
  song: Song
}

export function SongPlayer({ song }: Props) {
  // Reactive transport/practice state (the engine writes some, the UI writes rest).
  const isPlaying = usePlayer((s) => s.isPlaying)
  const isLoading = usePlayer((s) => s.isLoading)
  const currentBeat = usePlayer((s) => s.currentBeat)
  const bpm = usePlayer((s) => s.bpm)
  const targetKey = usePlayer((s) => s.targetKey)
  const hand = usePlayer((s) => s.hand)
  const loop = usePlayer((s) => s.loop)
  const waitMode = usePlayer((s) => s.waitMode)
  const metronome = usePlayer((s) => s.metronome)
  const countIn = usePlayer((s) => s.countIn)

  const [midi, setMidi] = useState<MidiConnection | null>(null)
  const [midiError, setMidiError] = useState<string | null>(null)

  // Transposition is a pure number transform: nearest-path offset → transposed
  // doc. Both the visuals AND the engine read this same transposed doc (engine is
  // then given transpose:0), so nothing can spell a note two different ways.
  const offset = useMemo(() => nearestOffset(song.original_key, targetKey), [song.original_key, targetKey])
  const doc = useMemo(() => transposeDoc(song.doc, offset), [song.doc, offset])

  const totalWidth = useMemo(() => {
    const [lo, hi] = padToC(LOW_MIDI, HIGH_MIDI)
    return keyboardLayout(lo, hi, WHITE_KEY_WIDTH).totalWidth
  }, [])

  // Live values the rebuild effect reads without re-triggering on their change.
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const loopRef = useRef(loop)
  loopRef.current = loop

  // Active section under the play-head (for progress + wait-mode range default).
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

  // Install the iOS audio unlock once; tear the engine down on leave.
  useEffect(() => {
    installAudioUnlock()
    return () => getEngine().dispose()
  }, [])

  // (Re)build the Tone part when the notes change (doc = key, or hand). Tempo and
  // loop change live and do NOT rebuild.
  useEffect(() => {
    const engine = getEngine()
    const wasPlaying = usePlayer.getState().isPlaying
    if (wasPlaying) engine.stop()
    engine.build(doc, {
      hand,
      bpm: bpmRef.current,
      loop: loopRef.current !== null,
      transpose: 0, // doc is already transposed
    })
    const lp = loopRef.current
    engine.setLoopRange(lp ? lp[0] : null, lp ? lp[1] : null)
    if (wasPlaying) void engine.play()
  }, [doc, hand])

  // Keep the engine's loop range in sync with the UI (live, no rebuild).
  useEffect(() => {
    const engine = getEngine()
    engine.setLoop(loop !== null)
    engine.setLoopRange(loop ? loop[0] : null, loop ? loop[1] : null)
  }, [loop])

  // Wait-mode trainer. Gate on the selected hand within the active section (or
  // the A-B loop range, or the whole song). Input arrives from MIDI or clicks.
  const waitRange: [number, number] | null = activeSection
    ? [activeSection.startBeat, activeSection.endBeat]
    : loop
  const onWaitLoop = useCallback(
    () => recordPractice(song.slug, bpmRef.current, activeSection?.id),
    [song.slug, activeSection],
  )
  const wait = useWaitMode(doc.notes, { range: waitRange, hand, onLoopComplete: onWaitLoop })
  const inputRef = useRef(wait.input)
  inputRef.current = wait.input

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

  // Record a completed pass when the loop wraps back to the top during playback.
  const prevBeatRef = useRef(0)
  useEffect(() => {
    if (!isPlaying) {
      prevBeatRef.current = currentBeat
      return
    }
    if (currentBeat < prevBeatRef.current - 0.5) {
      recordPractice(song.slug, bpmRef.current)
    }
    prevBeatRef.current = currentBeat
  }, [currentBeat, isPlaying, song.slug])

  // MIDI cleanup on unmount / reconnect.
  useEffect(() => () => midi?.dispose(), [midi])

  const onPlayToggle = () => {
    const engine = getEngine()
    if (usePlayer.getState().isPlaying) {
      engine.stop()
      recordPractice(song.slug, usePlayer.getState().bpm, usePlayer.getState().activeSectionId ?? undefined)
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
    // Loop the whole song when nothing is looped; clear otherwise.
    usePlayer.getState().setLoop(cur ? null : [0, doc.totalBeats])
  }
  const onKey = (k: number) => usePlayer.getState().setTargetKey(k)
  const onHand = (h: HandFilter) => usePlayer.getState().setHand(h)

  const onSelectSection = (s: { id: string; startBeat: number }) => {
    getEngine().seekTo(s.startBeat)
    usePlayer.getState().setActiveSection(s.id)
  }
  const onLoopSection = (s: { startBeat: number; endBeat: number }) => {
    const cur = usePlayer.getState().loop
    const same = cur && Math.abs(cur[0] - s.startBeat) < 1e-6 && Math.abs(cur[1] - s.endBeat) < 1e-6
    usePlayer.getState().setLoop(same ? null : [s.startBeat, s.endBeat])
  }

  const onConnectMidi = async () => {
    setMidiError(null)
    try {
      const conn = await connectMidi({
        onNoteOn: (pitch) => inputRef.current(pitch),
        onNoteOff: () => {},
      })
      if (!conn) setMidiError('MIDI støttes ikke her — bruk Chrome/Edge, eller klikk tangentene.')
      else setMidi(conn)
    } catch (e) {
      setMidiError(e instanceof Error ? e.message : 'Kunne ikke koble til MIDI-keyboard.')
    }
  }

  // Notes the keyboard lights up (hand-filtered so single-hand practice is clean).
  const keyboardNotes = useMemo(
    () => doc.notes.filter((n) => hand === 'both' || n.h === hand),
    [doc, hand],
  )
  const keyboardBeat = waitMode ? -1 : currentBeat

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
            'Bruk skjermklaviaturet — eller koble til et MIDI-keyboard'
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

      {/* Falling notes + keyboard share ONE horizontal scroll container so they
          always align pixel-for-pixel. */}
      <div className="scroll-x rounded-2xl border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
        <div style={{ width: totalWidth }} className="flex flex-col gap-2">
          <FallingNotes
            doc={doc}
            lowMidi={LOW_MIDI}
            highMidi={HIGH_MIDI}
            whiteKeyWidth={WHITE_KEY_WIDTH}
            waitBeat={waitMode ? wait.currentStepBeat : null}
            beatOverride={waitMode ? wait.currentStepBeat : null}
          />
          <Keyboard
            scroll={false}
            notes={keyboardNotes}
            currentBeat={keyboardBeat}
            expected={waitMode ? wait.expected : undefined}
            feedback={waitMode ? wait.feedback : undefined}
            onKeyPress={(m) => inputRef.current(m)}
            lowMidi={LOW_MIDI}
            highMidi={HIGH_MIDI}
            whiteKeyWidth={WHITE_KEY_WIDTH}
          />
        </div>
      </div>

      <ChordStrip
        chords={doc.chords}
        keySignature={doc.keySignature}
        currentBeat={waitMode ? (wait.currentStepBeat ?? 0) : currentBeat}
      />

      <SectionNav
        sections={doc.sections}
        currentBeat={waitMode ? (wait.currentStepBeat ?? 0) : currentBeat}
        loop={loop}
        onSelect={onSelectSection}
        onLoop={onLoopSection}
      />

      <TransportBar
        isPlaying={isPlaying}
        isLoading={isLoading}
        onPlayToggle={onPlayToggle}
        bpm={bpm}
        defaultBpm={song.default_bpm}
        onBpm={onBpm}
        targetKey={targetKey}
        onKey={onKey}
        hand={hand}
        onHand={onHand}
        metronome={metronome}
        onMetronomeToggle={() => usePlayer.getState().toggleMetronome()}
        countIn={countIn}
        onCountInToggle={() => usePlayer.getState().toggleCountIn()}
        waitMode={waitMode}
        onWaitToggle={() => usePlayer.getState().setWaitMode(!usePlayer.getState().waitMode)}
        loop={loop !== null}
        onLoopToggle={onLoopToggle}
      />

      {waitMode && (
        <p className="text-sm text-[var(--color-muted)]">
          Spill de <span className="text-[var(--color-amber)]">markerte</span> tangentene i rekkefølge
          {wait.total > 0 && (
            <>
              {' — '}
              <span className="font-display text-[var(--color-ivory)]">
                trinn {wait.step + 1} / {wait.total}
              </span>
            </>
          )}
          . Grønt = riktig, rødt = bom. Bruk MIDI eller klikk.
        </p>
      )}
    </div>
  )
}
