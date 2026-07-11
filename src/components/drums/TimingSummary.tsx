'use client'

import { RotateCcw } from 'lucide-react'
import type { SessionScore } from '@/lib/drums/timing'

// ── TimingSummary — the session scoreboard ────────────────────────────────────
// Live counts of perfect/early/late/miss plus the weighted hit percentage.
// Purely presentational; the trainer hook owns the numbers.

interface Props {
  score: SessionScore
  onReset?: () => void
}

const STATS: { key: keyof Omit<SessionScore, 'pct'>; label: string; color: string }[] = [
  { key: 'perfect', label: 'Perfekt', color: 'var(--color-sea)' },
  { key: 'early', label: 'Tidlig', color: 'var(--color-amber)' },
  { key: 'late', label: 'Sent', color: 'var(--color-amber)' },
  { key: 'miss', label: 'Bom', color: 'var(--color-danger)' },
]

export function TimingSummary({ score, onReset }: Props) {
  const total = score.perfect + score.early + score.late + score.miss
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <span className="text-sm text-[var(--color-muted)]">Økt</span>

      {STATS.map((s) => (
        <span key={s.key} className="inline-flex items-baseline gap-1.5 text-sm">
          <span className="font-display text-lg tabular-nums" style={{ color: s.color }}>
            {score[s.key]}
          </span>
          <span className="text-[var(--color-muted)]">{s.label}</span>
        </span>
      ))}

      <span className="ml-auto inline-flex items-baseline gap-1.5">
        <span className="font-display text-2xl tabular-nums text-[var(--color-ivory)]">
          {total > 0 ? `${score.pct}%` : '–'}
        </span>
        <span className="text-xs text-[var(--color-muted)]">treff</span>
      </span>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          title="Nullstill økta"
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Nullstill
        </button>
      )}
    </div>
  )
}
