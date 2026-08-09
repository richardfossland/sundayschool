'use client'

import type { SongChord } from '@/types/song'
import { chordSymbol } from '@/lib/spelling'
import { useBeatValue } from '@/lib/useBeatDriven'
import { cn } from '@/lib/cn'

// Chord strip: one flexible cell per chord, width ∝ duration, key-correct
// enharmonic spelling (in Eb: "Ab", not "G#"). The chord active at the play-head
// is highlighted. Chords and keySignature are already transposed by the caller.
//
// The play-head is read HERE (useBeatValue) unless the caller drives it, so the
// strip re-renders once per CHORD instead of once per frame — and the parent
// never re-renders at all. See lib/useBeatDriven.

const EPS = 1e-6

/** Index of the chord sounding at `beat`, or -1. On an overlap the LATEST onset
 * wins — the same tie-break the guitar player uses for its grip diagrams. */
function chordIndexAt(chords: SongChord[], beat: number): number {
  let idx = -1
  for (let i = 0; i < chords.length; i++) {
    const c = chords[i]
    if (c.t - EPS <= beat && beat < c.t + c.d - EPS) idx = i
  }
  return idx
}

interface Props {
  chords: SongChord[] // transposed (roots are pitch classes)
  keySignature: string // transposed key signature, for enharmonic spelling
  /** Omit to follow the live transport; pass a beat to drive it explicitly. */
  currentBeat?: number
}

export function ChordStrip({ chords, keySignature, currentBeat }: Props) {
  const driven = currentBeat !== undefined
  const liveIndex = useBeatValue(
    (beat) => (driven ? -1 : chordIndexAt(chords, beat)),
    [chords, driven],
  )
  const activeIndex = currentBeat === undefined ? liveIndex : chordIndexAt(chords, currentBeat)

  if (chords.length === 0) return null
  return (
    <div className="scroll-x rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2">
      <div className="flex gap-1" style={{ minWidth: '100%' }}>
        {chords.map((c, i) => {
          const active = i === activeIndex
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
