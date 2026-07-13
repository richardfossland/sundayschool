'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, Play, Music4 } from 'lucide-react'
import type { SongDoc, SongNote } from '@/types/song'
import { NotationSong } from '@/components/NotationSongLazy'
import { Keyboard } from '@/components/Keyboard'
import { getEngine } from '@/lib/engine'
import { connectMidi, type MidiConnection } from '@/lib/midi'
import { useWaitMode, type Feedback } from '@/lib/useWaitMode'
import { recordPractice } from '@/lib/progress'
import { createRng, generateReadingExercise, type Level } from '@/lib/bladspill/exercises'

// ── ReadingSession — the bladspill trainer ────────────────────────────────────
// Generates one reading exercise (a small SongDoc) from a per-mount seed, shows
// it in NotationSong, and drills it in one of two modes:
//   • Vent-modus  — the shared wait-mode gates the score note-by-note; the
//                   learner presses the right key(s) to advance. Untimed.
//   • Fri lesing  — a 3-2-1 count-in, then the learner reads straight through
//                   against the clock. We match the right-hand melody in order:
//                   a correct key advances, a wrong key counts a miss and holds.
//                   The result is reading speed (noter/min) + accuracy.
// Input is unified: both the on-screen keyboard and Web MIDI feed one handler.

const HALT = -1 // Keyboard: suppress time-based sounding highlights.

interface Props {
  level: Level
  mode: 'vent' | 'fri'
  /** Called after recording a new best so the parent can refresh its display. */
  onScore?: (bestPerMin: number) => void
}

const progressKeyFor = (level: Level) => `bladspill:nivaa-${level}`

type Phase =
  | { kind: 'idle' } // fri: before count-in / vent: before start
  | { kind: 'countin'; n: number } // fri only
  | { kind: 'playing' }
  | { kind: 'done'; perMin: number; accuracy: number }

export function ReadingSession({ level, mode, onScore }: Props) {
  // A fresh exercise per mount; "Ny oppgave" bumps the seed.
  const [seed, setSeed] = useState(() => Date.now())
  const doc = useMemo<SongDoc>(() => generateReadingExercise(level, createRng(seed)), [level, seed])

  // The right-hand melody, in reading order — the free-reading match target.
  const melody = useMemo<SongNote[]>(
    () => doc.notes.filter((n) => n.h === 'R').sort((a, b) => a.t - b.t),
    [doc],
  )
  const lowMidi = useMemo(() => Math.min(...doc.notes.map((n) => n.p)) - 2, [doc])
  const highMidi = useMemo(() => Math.max(...doc.notes.map((n) => n.p)) + 2, [doc])

  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [midiName, setMidiName] = useState<string | null>(null)

  // ── Free-reading state ─────────────────────────────────────────────────────
  const [friPos, setFriPos] = useState(0)
  const [friFeedback, setFriFeedback] = useState<Map<number, Feedback>>(new Map())
  const startAt = useRef(0)
  const hits = useRef(0)
  const misses = useRef(0)
  const posRef = useRef(0)
  posRef.current = friPos
  const phaseRef = useRef<Phase>(phase)
  phaseRef.current = phase
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // ── Wait-mode (vent) ───────────────────────────────────────────────────────
  const wait = useWaitMode(doc.notes, {
    hand: 'both',
    onLoopComplete: () => setPhase({ kind: 'done', perMin: 0, accuracy: 100 }),
  })

  // Reset everything when the exercise or mode changes.
  useEffect(() => {
    setPhase({ kind: 'idle' })
    setFriPos(0)
    setFriFeedback(new Map())
    hits.current = 0
    misses.current = 0
    wait.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, mode, level])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const flashFri = useCallback((midi: number, kind: Feedback) => {
    setFriFeedback((f) => new Map(f).set(midi, kind))
    const t = setTimeout(() => {
      setFriFeedback((f) => {
        const next = new Map(f)
        next.delete(midi)
        return next
      })
    }, 300)
    timers.current.push(t)
  }, [])

  const finishFri = useCallback(() => {
    const elapsedMin = Math.max((Date.now() - startAt.current) / 60000, 1 / 60000)
    const perMin = Math.round(hits.current / elapsedMin)
    const total = hits.current + misses.current
    const accuracy = total > 0 ? Math.round((hits.current / total) * 100) : 100
    const p = recordPractice(progressKeyFor(level), perMin)
    onScore?.(p.bestBpm[progressKeyFor(level)])
    setPhase({ kind: 'done', perMin, accuracy })
  }, [level, onScore])

  // The one input handler for both keyboard and MIDI.
  const handleInput = useCallback(
    (midi: number) => {
      if (mode === 'vent') {
        wait.input(midi)
        return
      }
      // Free reading: only live during 'playing'.
      void getEngine().playNote(midi, 0.85, 0.55)
      if (phaseRef.current.kind !== 'playing') return
      const expected = melody[posRef.current]
      if (!expected) return
      if (midi === expected.p) {
        hits.current += 1
        flashFri(midi, 'hit')
        const next = posRef.current + 1
        setFriPos(next)
        if (next >= melody.length) finishFri()
      } else {
        misses.current += 1
        flashFri(midi, 'miss')
      }
    },
    [mode, melody, wait, flashFri, finishFri],
  )

  const handleRef = useRef(handleInput)
  handleRef.current = handleInput

  // Connect Web MIDI once; route note-on into the same handler.
  useEffect(() => {
    let conn: MidiConnection | null = null
    let disposed = false
    void connectMidi({
      onNoteOn: (pitch) => handleRef.current(pitch),
      onNoteOff: () => {},
    }).then((c) => {
      if (disposed) {
        c?.dispose()
        return
      }
      conn = c
      if (c && c.deviceNames.length > 0) setMidiName(c.deviceNames.join(', '))
    })
    return () => {
      disposed = true
      conn?.dispose()
    }
  }, [])

  // Free-reading count-in: 3 → 2 → 1 → go.
  const startFri = useCallback(() => {
    setFriPos(0)
    hits.current = 0
    misses.current = 0
    setFriFeedback(new Map())
    let n = 3
    setPhase({ kind: 'countin', n })
    const tick = () => {
      n -= 1
      if (n > 0) {
        setPhase({ kind: 'countin', n })
        timers.current.push(setTimeout(tick, 700))
      } else {
        startAt.current = Date.now()
        setPhase({ kind: 'playing' })
      }
    }
    timers.current.push(setTimeout(tick, 700))
  }, [])

  const newExercise = useCallback(() => {
    wait.stop()
    setSeed(Date.now())
  }, [wait])

  // ── Keyboard props per mode ────────────────────────────────────────────────
  const kbFeedback = mode === 'vent' ? wait.feedback : friFeedback
  const kbExpected = mode === 'vent' ? wait.expected : undefined
  // In vent-mode we show the score's notes so the active step lights up.
  const kbNotes = mode === 'vent' ? doc.notes : []

  const done = phase.kind === 'done'
  const isCountin = phase.kind === 'countin'

  return (
    <div className="space-y-4">
      {/* The score */}
      <NotationSong doc={doc} />

      {/* Controls / status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-[var(--color-muted)]">
          {midiName ? (
            <span className="inline-flex items-center gap-1.5">
              <Music4 className="h-4 w-4" /> {midiName}
            </span>
          ) : (
            'Spill på klaviaturet under — eller koble til et MIDI-piano.'
          )}
        </div>

        <div className="flex items-center gap-2">
          {mode === 'vent' ? (
            wait.active ? (
              <button
                type="button"
                onClick={() => wait.stop()}
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
              >
                Stopp
              </button>
            ) : (
              <button
                type="button"
                onClick={() => wait.start()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--fag)] px-5 py-2.5 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
              >
                <Play className="h-4 w-4" />
                Start vent-modus
              </button>
            )
          ) : (
            phase.kind === 'idle' && (
              <button
                type="button"
                onClick={startFri}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--fag)] px-5 py-2.5 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
              >
                <Play className="h-4 w-4" />
                Start lesing
              </button>
            )
          )}
          <button
            type="button"
            onClick={newExercise}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
          >
            <RotateCcw className="h-4 w-4" />
            Ny oppgave
          </button>
        </div>
      </div>

      {/* Progress / count-in / result banner */}
      {mode === 'vent' && wait.active && (
        <p className="text-sm text-[var(--color-muted)]">
          Note {Math.min(wait.step + 1, wait.total)} av {wait.total} — trykk tonen(e) som lyser.
        </p>
      )}

      {mode === 'fri' && phase.kind === 'playing' && (
        <p className="text-sm text-[var(--color-muted)]">
          Tone {Math.min(friPos + 1, melody.length)} av {melody.length} — les videre!
        </p>
      )}

      {isCountin && (
        <p className="text-center font-display text-4xl text-[var(--fag)]">
          {(phase as { kind: 'countin'; n: number }).n}
        </p>
      )}

      {done && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
          {mode === 'fri' ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                Resultat
              </p>
              <p className="mt-2 font-display text-4xl text-[var(--color-ivory)]">
                {(phase as { perMin: number }).perMin} noter/min
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {(phase as { accuracy: number }).accuracy}% riktige toner
              </p>
            </>
          ) : (
            <p className="font-display text-2xl text-[#6BD08A]">Gjennomspilt!</p>
          )}
          <button
            type="button"
            onClick={newExercise}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--fag)] px-5 py-2.5 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Ny oppgave
          </button>
        </div>
      )}

      {/* The playable keyboard */}
      <Keyboard
        notes={kbNotes}
        currentBeat={HALT}
        expected={kbExpected}
        feedback={kbFeedback}
        onKeyPress={handleInput}
        lowMidi={lowMidi}
        highMidi={highMidi}
        whiteKeyWidth={32}
      />

      <p className="text-xs text-[var(--color-muted)]">
        {mode === 'vent'
          ? 'Vent-modus venter på deg — spill i ditt eget tempo, én tone om gangen.'
          : 'Fri lesing: les notene i jevnt tempo. Feil tone teller, men stopper deg ikke.'}
      </p>
    </div>
  )
}

export { progressKeyFor }
