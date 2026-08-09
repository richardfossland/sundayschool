'use client'

import { useMemo } from 'react'
import type { SongChord, SongDoc } from '@/types/song'
import { chordSymbol } from '@/lib/spelling'
import { barsBySection, type SheetBar } from '@/lib/guitar/chord-sheet-bars'
import { useBeatValue } from '@/lib/useBeatDriven'
import { cn } from '@/lib/cn'

// ── ChordSheet — akkordskjema ────────────────────────────────────────────────
// A readable chord chart: sections as headed blocks, bars as bordered cells.
// Each bar shows the chords whose onsets fall inside it; a bar that only
// sustains an earlier chord shows it dimmed in parentheses. Clicking a bar seeks
// the transport there. Chords and key signature are the PLAYED grips (capo
// already subtracted by the caller).
//
// The bars are the SONG'S bars: `splitBars(doc)` — the very same list the
// notation view engraves — bucketed into sections. It used to restart the grid
// inside every section, which produced half bars whenever a section did not
// begin on a bar line, and the chord chart then disagreed with the notation on
// 11 of the songs. One bar list, two views.
//
// The play-head is read here (useBeatValue) unless the caller drives it, so the
// sheet re-renders once per BAR, not once per frame.

const EPS = 1e-6

/** Index of the bar containing `beat`, across the flattened section list. */
function barIndexAt(flat: SheetBar[], beat: number): number {
  for (let i = 0; i < flat.length; i++) {
    if (beat >= flat[i].start - EPS && beat < flat[i].end - EPS) return i
  }
  return -1
}

interface Props {
  doc: SongDoc // for sections / bar grid (timing is capo-independent)
  chords: SongChord[] // played chords (roots transposed down by the capo)
  keySignature: string // played key signature
  /** Omit to follow the live transport; pass a beat to drive it explicitly. */
  currentBeat?: number
  onSeek?: (beat: number) => void
}

export function ChordSheet({ doc, chords, keySignature, currentBeat, onSeek }: Props) {
  const sections = useMemo(() => {
    const base =
      doc.sections.length > 0
        ? doc.sections
        : [
            {
              id: 'alt',
              kind: 'verse' as const,
              label: 'Hele sangen',
              startBeat: 0,
              endBeat: doc.totalBeats,
            },
          ]
    const buckets = barsBySection(doc, base)
    let offset = 0
    return base.map((s, i) => {
      const entry = { ...s, bars: buckets[i], offset }
      offset += buckets[i].length
      return entry
    })
  }, [doc])

  // One flat bar list so the active cell can be found with a single index —
  // and so an equal index never re-renders the sheet.
  const flatBars = useMemo(() => sections.flatMap((s) => s.bars), [sections])
  const liveBar = useBeatValue(
    (beat) => (currentBeat === undefined ? barIndexAt(flatBars, beat) : -1),
    [flatBars, currentBeat === undefined],
  )
  const activeBar = currentBeat === undefined ? liveBar : barIndexAt(flatBars, currentBeat)

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
              const active = s.offset + i === activeBar
              return (
                <button
                  key={i}
                  onClick={() => onSeek?.(bar.start)}
                  title={`Takt fra slag ${bar.start}`}
                  className={cn(
                    'flex min-h-11 min-w-[72px] items-center gap-2 border-l-2 px-3 py-2 text-left font-display text-lg transition-colors',
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
