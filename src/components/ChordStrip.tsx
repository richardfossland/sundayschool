'use client'

import type { SongChord } from '@/types/song'
import { chordSymbol } from '@/lib/spelling'
import { cn } from '@/lib/cn'

// Chord strip: one flexible cell per chord, width ∝ duration, key-correct
// enharmonic spelling (in Eb: "Ab", not "G#"). The chord active at `currentBeat`
// is highlighted. Chords and keySignature are already transposed by the caller.

const EPS = 1e-6

interface Props {
  chords: SongChord[] // transposed (roots are pitch classes)
  keySignature: string // transposed key signature, for enharmonic spelling
  currentBeat: number
}

export function ChordStrip({ chords, keySignature, currentBeat }: Props) {
  if (chords.length === 0) return null
  return (
    <div className="scroll-x rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
      <div className="flex gap-1" style={{ minWidth: '100%' }}>
        {chords.map((c, i) => {
          const active = c.t - EPS <= currentBeat && currentBeat < c.t + c.d - EPS
          return (
            <div
              key={i}
              className={cn(
                'flex h-14 items-center justify-center rounded-lg border px-2 font-display text-lg transition-colors duration-100',
                active
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15 text-[var(--color-amber)]'
                  : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-ivory)]',
              )}
              style={{ flexGrow: c.d, flexBasis: 0 }}
            >
              {chordSymbol(c.r, c.q, keySignature, c.b)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
