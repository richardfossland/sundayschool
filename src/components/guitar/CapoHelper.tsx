'use client'

import { useMemo } from 'react'
import { Sparkles } from 'lucide-react'
import type { SongChord } from '@/types/song'
import { bestCapo } from '@/lib/guitar/capo'
import { transposeKeySignature } from '@/lib/transpose'
import { cn } from '@/lib/cn'

// ── CapoHelper ────────────────────────────────────────────────────────────────
// Suggests the easiest capo for the SOUNDING chords (the user's target key) and
// lets the player pick 0–7. The capo never changes what sounds — only which
// grips the hands play — so the one-liner spells that out.

interface Props {
  /** Sounding chords (already transposed to the target key). */
  chords: SongChord[]
  /** Sounding key signature, for the «spill som …» label. */
  keySignature: string
  capo: number
  onCapo: (capo: number) => void
}

export function CapoHelper({ chords, keySignature, capo, onCapo }: Props) {
  const suggestion = useMemo(() => bestCapo(chords), [chords])
  const playedKeyAt = (c: number) => transposeKeySignature(keySignature, -c)

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0 text-sm text-[var(--color-muted)]">Capo</span>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 8 }, (_, c) => (
            <button
              key={c}
              onClick={() => onCapo(c)}
              aria-pressed={capo === c}
              title={c === 0 ? 'Uten capo' : `Capo ${c} — spill som ${playedKeyAt(c)}-former`}
              className={cn(
                'h-9 w-9 rounded-lg border text-sm font-medium tabular-nums transition-colors',
                capo === c
                  ? 'border-[var(--fag-gitar)] bg-[var(--fag-gitar)] text-[var(--color-ink-on-amber)]'
                  : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-ivory)] hover:border-[var(--fag-gitar)]/50',
              )}
            >
              {c}
            </button>
          ))}
        </div>
        {suggestion.capo !== capo && (
          <button
            onClick={() => onCapo(suggestion.capo)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--fag-gitar)]/60 px-3 py-1.5 text-sm font-medium text-[var(--fag-gitar)] transition-colors hover:bg-[var(--fag-gitar)]/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {suggestion.capo === 0
              ? 'Forslag: uten capo'
              : `Forslag: capo ${suggestion.capo} → spill som ${playedKeyAt(suggestion.capo)}-former`}
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        Capoen flytter grepene, ikke klangen — du klinger fortsatt i {keySignature}
        {capo > 0 ? `, men spiller ${playedKeyAt(capo)}-former` : ''}.
      </p>
    </div>
  )
}
