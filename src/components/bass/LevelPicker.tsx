'use client'

import { cn } from '@/lib/cn'
import type { BassLevel } from '@/lib/bass/bassline'

// Bass level selector — which generated bassline the learner practices.
// Mirrors the chord-level picker in SongPlayer (same chip styling).

const LEVELS: { level: BassLevel; label: string; hint: string }[] = [
  { level: 1, label: 'Grunntoner', hint: 'Rotnoten holdes gjennom hele akkorden' },
  { level: 2, label: 'Rot og kvint', hint: 'Rot på tunge slag, kvint på lette' },
  { level: 3, label: 'Vandrende', hint: 'Gangbass med akkordtoner og ledetoner' },
]

interface Props {
  level: BassLevel
  onLevel: (level: BassLevel) => void
}

export function LevelPicker({ level, onLevel }: Props) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1.5 w-16 shrink-0 text-sm text-[var(--color-muted)]">Nivå</span>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {LEVELS.map(({ level: l, label, hint }) => (
          <button
            key={l}
            onClick={() => onLevel(l)}
            aria-pressed={level === l}
            title={hint}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              level === l
                ? 'border-[var(--color-amber)] bg-[var(--color-amber)] text-[var(--color-ink-on-amber)]'
                : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-ivory)] hover:border-[var(--color-amber)]/50',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
