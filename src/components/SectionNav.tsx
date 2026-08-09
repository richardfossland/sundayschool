'use client'

import { Repeat } from 'lucide-react'
import type { SongSection } from '@/types/song'
import { useBeatValue } from '@/lib/useBeatDriven'
import { cn } from '@/lib/cn'

// Section chips (vers / refreng / bro …). Clicking a chip seeks to its start and
// marks it active; the little loop button drills just that section (A-B loop on
// its beat range). The section under the play-head is highlighted live.
//
// "Live" means this component subscribes to the transport itself and re-renders
// only when the play-head crosses INTO another section — the parent stays out of
// the 60 Hz path entirely. See lib/useBeatDriven.

const EPS = 1e-6

/** Index of the section containing `beat`, or -1. */
function sectionIndexAt(sections: SongSection[], beat: number): number {
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]
    if (beat >= s.startBeat - EPS && beat < s.endBeat - EPS) return i
  }
  return -1
}

interface Props {
  sections: SongSection[]
  /** Omit to follow the live transport; pass a beat to drive it explicitly
   * (wait-/grep-mode freeze the picture at the current step). */
  currentBeat?: number
  /** Active A-B loop range, to show which section (if any) is being looped. */
  loop: [number, number] | null
  /** Seek to a section and select it. */
  onSelect: (section: SongSection) => void
  /** Toggle an A-B loop over this section's range. */
  onLoop: (section: SongSection) => void
}

export function SectionNav({ sections, currentBeat, loop, onSelect, onLoop }: Props) {
  const driven = currentBeat !== undefined
  const liveIndex = useBeatValue(
    (beat) => (driven ? -1 : sectionIndexAt(sections, beat)),
    [sections, driven],
  )
  const playingIndex =
    currentBeat === undefined ? liveIndex : sectionIndexAt(sections, currentBeat)

  if (sections.length <= 1) return null

  const isLooped = (s: SongSection) =>
    !!loop && Math.abs(loop[0] - s.startBeat) < EPS && Math.abs(loop[1] - s.endBeat) < EPS

  return (
    <div className="scroll-x">
      <div className="flex gap-2">
        {sections.map((s, i) => {
          const playing = i === playingIndex
          const looped = isLooped(s)
          return (
            <div
              key={s.id}
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border pr-1 transition-colors',
                playing
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15'
                  : looped
                    ? 'border-[var(--color-sea)] bg-[var(--color-sea)]/10'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]',
              )}
            >
              <button
                onClick={() => onSelect(s)}
                className={cn(
                  'min-h-11 rounded-full pl-3.5 pr-1 text-sm font-medium transition-colors',
                  playing
                    ? 'text-[var(--color-amber)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
                )}
              >
                {s.label}
              </button>
              {/* 44×44 touch target; the visible pill stays small (the icon is
                  centred in a transparent 11×11 rem-grid cell). */}
              <button
                onClick={() => onLoop(s)}
                aria-pressed={looped}
                aria-label={`Loop ${s.label}`}
                title={`Loop ${s.label}`}
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors',
                  looped
                    ? 'text-[var(--color-sea)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-full transition-colors',
                    looped && 'bg-[var(--color-sea)]/25',
                  )}
                >
                  <Repeat className="h-3.5 w-3.5" />
                </span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
