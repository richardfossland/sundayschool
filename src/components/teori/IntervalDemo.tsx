'use client'

import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { SIMPLE_INTERVALS } from '@/lib/theory/intervals'
import { noteName } from '@/lib/music'
import { Keyboard } from '@/components/Keyboard'
import { cn } from '@/lib/cn'

// ── IntervalDemo ──────────────────────────────────────────────────────────────
// Pick an interval → hear it (two notes in sequence from middle C) and see both
// keys outlined on a small keyboard. Uses the shared Keyboard as a display
// surface: `expected` outlines the keys, currentBeat = -1 suppresses playback
// highlighting, and notes = [] since nothing is scheduled.

const ROOT = 60 // C4

export function IntervalDemo() {
  const [semitones, setSemitones] = useState(7) // ren kvint by default

  useEffect(() => {
    installAudioUnlock()
  }, [])

  const play = (iv: number) => {
    const engine = getEngine()
    void engine.playNote(ROOT, 0.85, 0.8)
    // Sequential: the second note ~0.7s after the first.
    window.setTimeout(() => void engine.playNote(ROOT + iv, 0.85, 1.0), 700)
  }

  const select = (iv: number) => {
    setSemitones(iv)
    play(iv)
  }

  const current = SIMPLE_INTERVALS.find((i) => i.semitones === semitones)!

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap gap-1.5">
        {SIMPLE_INTERVALS.map(({ semitones: iv, name }) => (
          <button
            key={iv}
            type="button"
            onClick={() => select(iv)}
            aria-pressed={iv === semitones}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              iv === semitones
                ? 'border-transparent bg-[var(--fag-teori)] text-[var(--color-scene)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => play(semitones)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--fag-teori)] px-4 py-2 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
        >
          <Play className="h-4 w-4" />
          Spill
        </button>
        <p className="text-sm text-[var(--color-muted)]">
          <span className="font-medium text-[var(--color-ivory)]">{current.name}</span>
          {' — '}
          {noteName(ROOT)} → {noteName(ROOT + semitones)} ({semitones}{' '}
          {semitones === 1 ? 'halvtone' : 'halvtoner'})
        </p>
      </div>

      <div className="mt-4">
        <Keyboard
          notes={[]}
          currentBeat={-1}
          expected={new Set([ROOT, ROOT + semitones])}
          onKeyPress={(midi) => void getEngine().playNote(midi, 0.85, 0.8)}
          lowMidi={60}
          highMidi={84}
          whiteKeyWidth={30}
        />
      </div>
    </div>
  )
}
