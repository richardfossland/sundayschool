'use client'

import { STRUM_PATTERNS, type StrumPattern } from '@/lib/guitar/strumming'
import { cn } from '@/lib/cn'

// ── StrumPatternPicker ────────────────────────────────────────────────────────
// One chip per strum pattern, with a tiny D/U preview of the strokes. Patterns
// written for another meter than the song's are shown but dimmed (they still
// work — the bar just cycles differently).

interface Props {
  patterns?: StrumPattern[]
  activeId: string
  onSelect: (id: string) => void
  /** The song's time signature — patterns for other meters render dimmed. */
  timeSignature: string
}

export function StrumPatternPicker({
  patterns = STRUM_PATTERNS,
  activeId,
  onSelect,
  timeSignature,
}: Props) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-2 w-16 shrink-0 text-sm text-[var(--color-muted)]">Rytme</span>
      <div className="flex flex-wrap gap-1.5">
        {patterns.map((p) => {
          const active = p.id === activeId
          const foreignMeter = p.timeSignature !== timeSignature
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              aria-pressed={active}
              title={`${p.label} (${p.timeSignature})`}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-colors',
                active
                  ? 'border-[var(--fag-gitar)] bg-[var(--fag-gitar)]/15'
                  : 'border-[var(--color-border)] bg-[var(--color-raised)] hover:border-[var(--fag-gitar)]/50',
                foreignMeter && !active && 'opacity-55',
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-[var(--fag-gitar)]' : 'text-[var(--color-ivory)]',
                )}
              >
                {p.label}
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[var(--color-muted)]">
                {p.strokes.map((s) => (s.accent ? s.dir : s.dir.toLowerCase())).join(' ')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
