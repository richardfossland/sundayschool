'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Music, Plug, ListMusic } from 'lucide-react'
import type { Song, HandFilter } from '@/types/song'
import { usePlayer } from '@/lib/store'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { nearestOffset, transposeDoc } from '@/lib/transpose'
import { recordPractice } from '@/lib/progress'
import { connectMidi, midiSupported, type MidiConnection } from '@/lib/midi'
import { useWaitMode } from '@/lib/useWaitMode'
import { useChordMode } from '@/lib/useChordMode'
import type { ChordLevel } from '@/lib/chord-match'
import { voicingOverlay } from '@/lib/voicing-hints'
import type { Feedback } from '@/lib/useWaitMode'
import { KEY_NAMES } from '@/lib/music'
import { cn } from '@/lib/cn'
import { bandTracks, applyBandMix } from '@/lib/band'
import { FallingNotes } from './FallingNotes'
import { FallingChords } from './FallingChords'
import { Keyboard } from './Keyboard'
import { ChordStrip } from './ChordStrip'
import { SectionNav } from './SectionNav'
import { TransportBar } from './TransportBar'
import { BandPanel } from './BandPanel'
import { NotationSong as NotationSongLazy } from './NotationSongLazy'
import { keyboardLayout, padToC } from '@/lib/keyboard-geometry'

const CHORD_LEVELS: { level: ChordLevel; label: string }[] = [
  { level: 1, label: 'Grunnstilling' },
  { level: 2, label: 'Inversjoner' },
  { level: 3, label: 'Utvidelser' },
  { level: 4, label: 'Gospel' },
]

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
  const activeSectionId = usePlayer((s) => s.activeSectionId)
  const waitMode = usePlayer((s) => s.waitMode)
  const metronome = usePlayer((s) => s.metronome)
  const countIn = usePlayer((s) => s.countIn)
  const bandMode = usePlayer((s) => s.bandMode)

  const [midi, setMidi] = useState<MidiConnection | null>(null)
  const [midiError, setMidiError] = useState<string | null>(null)
  const [showNotation, setShowNotation] = useState(false)
  const [chordMode, setChordMode] = useState(false)

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

  // Subject-prefixed progress key (Skolen v2 — all keys are `{fag}:{slug}`).
  // Piano is the only instrument that mounts SongPlayer today.
  const progressKey = `piano:${song.slug}`

  // The section the learner EXPLICITLY picked in SectionNav (null = none). The
  // play-head's section is NOT a substitute: it is never null, so deriving the
  // trainer range from it pins the range to whatever section the (stopped)
  // play-head sits in — always the first one.
  const selectedSection = useMemo(
    () => (activeSectionId ? (doc.sections.find((s) => s.id === activeSectionId) ?? null) : null),
    [doc.sections, activeSectionId],
  )

  // Reset transport controls to the song's defaults when the song changes.
  // metronome/countIn/bandMode are global and other fag (rytme, groove) turn
  // them on, so a fresh song must start from the song player's own defaults.
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
      metronome: false,
      countIn: false,
      bandMode: false, // the mixer LEVELS (bandMix) are a preference — kept
    })
  }, [song.slug, song.original_key, song.default_bpm])

  // Install the iOS audio unlock once; release the engine (parts + transport,
  // NOT the loaded samples) on leave.
  useEffect(() => {
    installAudioUnlock()
    return () => getEngine().release()
  }, [])

  // (Re)build the Tone part when the notes change (doc = key, hand, or band). In
  // band-modus the learner plays piano themselves, so the piano main track is
  // emptied and the app plays bass+drums (bandTracks excludes piano). Tempo and
  // loop change live and do NOT rebuild.
  useEffect(() => {
    const engine = getEngine()
    const wasPlaying = usePlayer.getState().isPlaying
    if (wasPlaying) engine.stop()
    engine.build(bandMode ? { ...doc, notes: [] } : doc, {
      hand,
      bpm: bpmRef.current,
      loop: loopRef.current !== null,
      transpose: 0, // doc is already transposed
      extraTracks: bandMode ? bandTracks(doc, { exclude: 'piano', bpm: song.default_bpm }) : undefined,
    })
    if (bandMode) applyBandMix(engine, usePlayer.getState().bandMix)
    const lp = loopRef.current
    engine.setLoopRange(lp ? lp[0] : null, lp ? lp[1] : null)
    if (wasPlaying) void engine.play()
  }, [doc, hand, bandMode, song.default_bpm])

  // Keep the engine's loop range in sync with the UI (live, no rebuild).
  useEffect(() => {
    const engine = getEngine()
    engine.setLoop(loop !== null)
    engine.setLoopRange(loop ? loop[0] : null, loop ? loop[1] : null)
  }, [loop])

  // Wait-mode trainer. Gate on the selected hand within the section the learner
  // picked (or the A-B loop range, or the whole song). Input arrives from MIDI
  // or clicks.
  const waitRange: [number, number] | null = selectedSection
    ? [selectedSection.startBeat, selectedSection.endBeat]
    : loop
  const onWaitLoop = useCallback(
    () => recordPractice(progressKey, bpmRef.current, selectedSection?.id),
    [progressKey, selectedSection],
  )
  const wait = useWaitMode(doc.notes, { range: waitRange, hand, onLoopComplete: onWaitLoop })
  const inputRef = useRef(wait.input)
  inputRef.current = wait.input

  // Besifringsmodus (chord mode): step the chord track, gate on a held grip at
  // the chosen level. Shares the section/loop range with wait-mode.
  const chord = useChordMode(doc.chords, { range: waitRange, onLoopComplete: onWaitLoop })

  // Route live MIDI to whichever trainer is active (updated every render). The
  // connectMidi handlers are installed once and read this ref.
  const midiRoute = useRef<{ onNoteOn: (p: number) => void; onNoteOff: (p: number) => void }>({
    onNoteOn: () => {},
    onNoteOff: () => {},
  })
  midiRoute.current.onNoteOn = chordMode ? chord.noteOn : (p: number) => inputRef.current(p)
  midiRoute.current.onNoteOff = chordMode ? chord.noteOff : () => {}

  // Enter/leave besifringsmodus: stop the transport + wait-mode on enter.
  useEffect(() => {
    if (chordMode) {
      getEngine().stop()
      if (usePlayer.getState().waitMode) usePlayer.getState().setWaitMode(false)
      chord.start()
    } else {
      chord.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chordMode])

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
      recordPractice(progressKey, bpmRef.current)
    }
    prevBeatRef.current = currentBeat
  }, [currentBeat, isPlaying, progressKey])

  // MIDI cleanup on unmount / reconnect.
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
        onNoteOn: (pitch) => midiRoute.current.onNoteOn(pitch),
        onNoteOff: (pitch) => midiRoute.current.onNoteOff(pitch),
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
  // Suppress note-based highlighting in both trainers (they drive the keyboard
  // via `expected`/`feedback` instead).
  const keyboardBeat = chordMode || waitMode ? -1 : currentBeat

  // In besifringsmodus the held grip is outlined, and a match/mismatch flashes
  // every held key green/red; a voicing hint dots the suggested notes.
  const chordFeedbackMap = useMemo<Map<number, Feedback> | undefined>(() => {
    if (!chordMode) return undefined
    const m = new Map<number, Feedback>()
    if (chord.feedback === 'valid' || chord.feedback === 'wrong') {
      const kind: Feedback = chord.feedback === 'valid' ? 'hit' : 'miss'
      for (const p of chord.held) m.set(p, kind)
    }
    return m
  }, [chordMode, chord.feedback, chord.held])
  const chordOverlay =
    chordMode && chord.currentChord ? voicingOverlay(chord.currentChord, chord.level) : undefined

  const chordBeat = chord.currentBeat ?? 0
  const stripBeat = chordMode ? chordBeat : waitMode ? (wait.currentStepBeat ?? 0) : currentBeat

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChordMode((v) => !v)}
            aria-pressed={chordMode}
            title="Øv på akkordgrep etter besifring"
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
              chordMode
                ? 'border-[var(--color-amber)] text-[var(--color-amber)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]'
            }`}
          >
            <ListMusic className="h-4 w-4" /> Besifring
          </button>
          <button
            onClick={() => setShowNotation((v) => !v)}
            aria-pressed={showNotation}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
              showNotation
                ? 'border-[var(--color-amber)] text-[var(--color-amber)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]'
            }`}
          >
            <Music className="h-4 w-4" /> Noter
          </button>
          {midiSupported() && !midi && (
            <button
              onClick={onConnectMidi}
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
            >
              <Plug className="h-4 w-4" /> Koble til MIDI
            </button>
          )}
        </div>
      </div>
      {midiError && <p className="text-xs text-[var(--color-danger)]">{midiError}</p>}

      {/* Falling notes + keyboard share ONE horizontal scroll container so they
          always align pixel-for-pixel. */}
      <div className="scroll-x rounded-2xl border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
        <div style={{ width: totalWidth }} className="flex flex-col gap-2">
          {chordMode ? (
            <FallingChords
              chords={doc.chords}
              keySignature={doc.keySignature}
              beatOverride={chordBeat}
              activeIndex={chord.index}
              hit={chord.feedback === 'valid'}
              widthPx={totalWidth}
            />
          ) : (
            <FallingNotes
              doc={doc}
              lowMidi={LOW_MIDI}
              highMidi={HIGH_MIDI}
              whiteKeyWidth={WHITE_KEY_WIDTH}
              waitBeat={waitMode ? wait.currentStepBeat : null}
              beatOverride={waitMode ? wait.currentStepBeat : null}
            />
          )}
          <Keyboard
            scroll={false}
            notes={keyboardNotes}
            currentBeat={keyboardBeat}
            expected={chordMode ? chord.held : waitMode ? wait.expected : undefined}
            feedback={chordMode ? chordFeedbackMap : waitMode ? wait.feedback : undefined}
            overlay={chordOverlay}
            onKeyPress={(m) => (chordMode ? chord.toggleHold(m) : inputRef.current(m))}
            lowMidi={LOW_MIDI}
            highMidi={HIGH_MIDI}
            whiteKeyWidth={WHITE_KEY_WIDTH}
          />
        </div>
      </div>

      <ChordStrip chords={doc.chords} keySignature={doc.keySignature} currentBeat={stripBeat} />

      {/* Real notation, synchronized to the same transposed doc («notasjonsbro»).
          Click a bar to seek the transport there. */}
      {showNotation && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <NotationSongLazy
            doc={doc}
            follow={isPlaying}
            onSeek={(beat) => {
              getEngine().seekTo(beat)
              usePlayer.getState().set({ currentBeat: beat })
            }}
          />
        </div>
      )}

      <SectionNav
        sections={doc.sections}
        currentBeat={stripBeat}
        loop={loop}
        onSelect={onSelectSection}
        onLoop={onLoopSection}
      />

      {chordMode ? (
        /* Besifringsmodus controls: level selector + key (the transport does not
           apply — the trainer is driven entirely by the held grip). */
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-start gap-2">
            <span className="mt-1.5 w-16 shrink-0 text-sm text-[var(--color-muted)]">Nivå</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {CHORD_LEVELS.map(({ level, label }) => (
                <button
                  key={level}
                  onClick={() => chord.setLevel(level)}
                  aria-pressed={chord.level === level}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                    chord.level === level
                      ? 'border-[var(--color-amber)] bg-[var(--color-amber)] text-[var(--color-ink-on-amber)]'
                      : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-ivory)] hover:border-[var(--color-amber)]/50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-1.5 w-16 shrink-0 text-sm text-[var(--color-muted)]">Toneart</span>
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
              {KEY_NAMES.map((name, k) => (
                <button
                  key={k}
                  onClick={() => onKey(k)}
                  aria-pressed={targetKey === k}
                  className={cn(
                    'rounded-lg border py-1.5 text-sm font-medium tabular-nums transition-colors',
                    targetKey === k
                      ? 'border-[var(--color-amber)] bg-[var(--color-amber)] text-[var(--color-ink-on-amber)]'
                      : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-ivory)] hover:border-[var(--color-amber)]/50',
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
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
      )}

      {!chordMode && <BandPanel own="piano" />}

      {chordMode && (
        <p className="text-sm text-[var(--color-muted)]">
          Spill akkorden{' '}
          {chord.currentChord && (
            <span className="font-display text-[var(--color-amber)]">
              {chord.index + 1} / {chord.total}
            </span>
          )}{' '}
          — hold grepet (MIDI eller klikk tangentene). Prikkene viser et forslag til grep.
          {chord.feedback === 'wrong' && (
            <span className="text-[var(--color-danger)]"> Feil tone — prøv igjen.</span>
          )}
        </p>
      )}

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
