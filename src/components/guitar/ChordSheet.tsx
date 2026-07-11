'use client'

import { useMemo } from 'react'
import type { SongChord, SongDoc } from '@/types/song'
import { chordSymbol } from '@/lib/spelling'
import { cn } from '@/lib/cn'

// ── ChordSheet — akkordskjema ────────────────────────────────────────────────
// A readable chord chart: sections as headed blocks, bars as bordered cells in
// the global bar grid (pickup respected). Each bar shows the chords whose
// onsets fall inside it; a bar that only sustains an earlier chord shows it
// dimmed in parentheses. Clicking a bar seeks the transport there. Chords and
// key signature are the PLAYED grips (capo already subtracted by the caller).

const EPS = 1e-6

interface Props {
  doc: SongDoc // for sections / bar grid (timing is capo-independent)
  chords: SongChord[] // played chords (roots transposed down by the capo)
  keySignature: string // played key signature
  currentBeat: number
  onSeek?: (beat: number) => void
}

interface Bar {
  start: number
  end: number
}

/** Bars of [start, end) covering the section, aligned to the global bar grid
 * anchored at pickupBeats (a pickup yields a short lead-in bar). */
function barsOf(section: { startBeat: number; endBeat: number }, beatsPerBar: number, pickup: number): Bar[] {
  const bars: Bar[] = []
  let t = section.startBeat
  while (t < section.endBeat - EPS) {
    // Next global bar line after t: pickup + k·beatsPerBar.
    const k = Math.floor((t - pickup) / beatsPerBar + EPS) + 1
    const nextLine = pickup + k * beatsPerBar
    const end = Math.min(section.endBeat, nextLine <= t + EPS ? t + beatsPerBar : nextLine)
    bars.push({ start: t, end })
    t = end
  }
  return bars
}

export function ChordSheet({ doc, chords, keySignature, currentBeat, onSeek }: Props) {
  const sections = useMemo(
    () =>
      (doc.sections.length > 0
        ? doc.sections
        : [{ id: 'alt', kind: 'verse' as const, label: 'Hele sangen', startBeat: 0, endBeat: doc.totalBeats }]
      ).map((s) => ({ ...s, bars: barsOf(s, doc.beatsPerBar, doc.pickupBeats) })),
    [doc],
  )

  const label = (c: SongChord) => chordSymbol(c.r, c.q, keySignature, c.b)
  const sounding = (t: number) => {
    let cur: SongChord | null = null
    for (const c of chords) if (c.t <= t + EPS && t < c.t + c.d - EPS) cur = c
    return cur
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {sections.map((s) => (
        <section key={s.id}>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {s.label}
          </h3>
          <div className="flex flex-wrap gap-y-1.5">
            {s.bars.map((bar, i) => {
              const onsets = chords.filter((c) => c.t >= bar.start - EPS && c.t < bar.end - EPS)
              const carry = onsets.length === 0 ? sounding(bar.start) : null
              const active = currentBeat >= bar.start - EPS && currentBeat < bar.end - EPS
              return (
                <button
                  key={i}
                  onClick={() => onSeek?.(bar.start)}
                  title={`Takt fra slag ${bar.start}`}
                  className={cn(
                    'flex min-w-[72px] items-center gap-2 border-l-2 px-3 py-2 text-left font-display text-lg transition-colors',
                    active
                      ? 'border-[var(--fag-gitar)] bg-[var(--fag-gitar)]/12 text-[var(--fag-gitar)]'
                      : 'border-[var(--color-border)] text-[var(--color-ivory)] hover:bg-[var(--color-raised)]',
                  )}
                >
                  {onsets.length > 0 ? (
                    onsets.map((c, j) => <span key={j}>{label(c)}</span>)
                  ) : carry ? (
                    <span className="text-[var(--color-muted)]">({label(carry)})</span>
                  ) : (
                    <span className="text-[var(--color-muted)]">·</span>
                  )}
                </button>
              )
            })}
            {/* Closing bar line */}
            <span aria-hidden className="border-l-2 border-[var(--color-border)]" />
          </div>
        </section>
      ))}
    </div>
  )
}
