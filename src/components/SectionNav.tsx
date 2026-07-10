'use client'

import { Repeat } from 'lucide-react'
import type { SongSection } from '@/types/song'
import { cn } from '@/lib/cn'

// Section chips (vers / refreng / bro …). Clicking a chip seeks to its start and
// marks it active; the little loop button drills just that section (A-B loop on
// its beat range). The section under the play-head is highlighted live.

const EPS = 1e-6

interface Props {
  sections: SongSection[]
  currentBeat: number
  /** Active A-B loop range, to show which section (if any) is being looped. */
  loop: [number, number] | null
  /** Seek to a section and select it. */
  onSelect: (section: SongSection) => void
  /** Toggle an A-B loop over this section's range. */
  onLoop: (section: SongSection) => void
}

export function SectionNav({ sections, currentBeat, loop, onSelect, onLoop }: Props) {
  if (sections.length <= 1) return null

  const isPlaying = (s: SongSection) =>
    currentBeat >= s.startBeat - EPS && currentBeat < s.endBeat - EPS
  const isLooped = (s: SongSection) =>
    !!loop && Math.abs(loop[0] - s.startBeat) < EPS && Math.abs(loop[1] - s.endBeat) < EPS

  return (
    <div className="scroll-x">
      <div className="flex gap-2">
        {sections.map((s) => {
          const playing = isPlaying(s)
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
                  'rounded-full py-1.5 pl-3.5 pr-1 text-sm font-medium transition-colors',
                  playing
                    ? 'text-[var(--color-amber)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
                )}
              >
                {s.label}
              </button>
              <button
                onClick={() => onLoop(s)}
                aria-pressed={looped}
                aria-label={`Loop ${s.label}`}
                title={`Loop ${s.label}`}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                  looped
                    ? 'bg-[var(--color-sea)]/25 text-[var(--color-sea)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
                )}
              >
                <Repeat className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
