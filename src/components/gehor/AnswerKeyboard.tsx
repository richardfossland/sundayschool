'use client'

import { useEffect, useRef, useState } from 'react'
import { getEngine } from '@/lib/engine'
import { Keyboard } from '@/components/Keyboard'
import type { Feedback } from '@/lib/useWaitMode'

// ── AnswerKeyboard ────────────────────────────────────────────────────────────
// Melody-dictation answer surface: a thin wrapper around the shared Keyboard.
// The learner clicks the tones they heard, in order. Every press sounds; a
// correct press locks in green and advances, a wrong press flashes red (and
// counts one mistake for that position). The expected key is NOT outlined —
// this is ear training, not wait-mode. Reports (correctFirstTry, total) when
// the last tone is placed.

interface Props {
  /** The expected melody, in order (MIDI pitches). */
  melody: number[]
  /** Called once, when the final tone has been placed. */
  onComplete: (correctFirstTry: number, total: number) => void
  /** Bump to reset for a new exercise (e.g. the exercise index). */
  resetKey: number | string
}

export function AnswerKeyboard({ melody, onComplete, resetKey }: Props) {
  const [position, setPosition] = useState(0)
  const [feedback, setFeedback] = useState<Map<number, Feedback>>(new Map())
  // Positions answered wrong at least once (first-try scoring).
  const missedAt = useRef<Set<number>>(new Set())
  const timeouts = useRef<number[]>([])

  // Reset on a new exercise.
  useEffect(() => {
    setPosition(0)
    setFeedback(new Map())
    missedAt.current = new Set()
  }, [resetKey])

  useEffect(() => {
    const pending = timeouts.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const done = position >= melody.length

  const press = (midi: number) => {
    void getEngine().playNote(midi, 0.85, 0.6)
    if (done) return
    const expected = melody[position]
    if (midi === expected) {
      setFeedback((f) => new Map(f).set(midi, 'hit'))
      // Clear the green after a beat so repeated tones can light again.
      timeouts.current.push(
        window.setTimeout(() => {
          setFeedback((f) => {
            const next = new Map(f)
            next.delete(midi)
            return next
          })
        }, 450),
      )
      const nextPos = position + 1
      setPosition(nextPos)
      if (nextPos >= melody.length) {
        onComplete(melody.length - missedAt.current.size, melody.length)
      }
    } else {
      missedAt.current.add(position)
      setFeedback((f) => new Map(f).set(midi, 'miss'))
      timeouts.current.push(
        window.setTimeout(() => {
          setFeedback((f) => {
            const next = new Map(f)
            next.delete(midi)
            return next
          })
        }, 450),
      )
    }
  }

  // Range: one octave around the melody, C-padded by the Keyboard itself.
  const lo = Math.min(...melody) - 2
  const hi = Math.max(...melody) + 2

  return (
    <div>
      <p className="mb-2 text-sm text-[var(--color-muted)]">
        {done ? 'Ferdig!' : `Tone ${position + 1} av ${melody.length} — klikk tonen du hørte`}
      </p>
      <Keyboard
        notes={[]}
        currentBeat={-1}
        feedback={feedback}
        onKeyPress={press}
        lowMidi={lo}
        highMidi={hi}
        whiteKeyWidth={34}
      />
    </div>
  )
}
