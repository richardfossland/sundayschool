'use client'

import { useEffect, useState } from 'react'
import { Eye, Check, X } from 'lucide-react'
import type { MemoryVerse } from '@/types/teologi'
import { cn } from '@/lib/cn'

// ── VerseCard ─────────────────────────────────────────────────────────────────
// One memorisation card. Flow: the reference is shown alone → the learner
// recites from memory → "Vis verset" reveals the text → they judge themselves
// with «Husket» / «Husket ikke», which the parent feeds into sr.review(). The
// reveal uses the app's light fade-in — a "flip feel" without heavy animation
// (and none at all under prefers-reduced-motion).

export function VerseCard({
  verse,
  onResult,
}: {
  verse: MemoryVerse
  /** Called once per card after reveal; true = husket. */
  onResult: (correct: boolean) => void
}) {
  const [revealed, setRevealed] = useState(false)

  // A new verse resets the card to its hidden state.
  useEffect(() => setRevealed(false), [verse.id])

  return (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8"
      style={{ ['--fag' as string]: 'var(--fag-teologi)' }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: 'var(--fag-teologi)' }}
      >
        {verse.ref}
      </p>

      {!revealed ? (
        <>
          <p className="mt-4 text-[var(--color-muted)]">
            Fremsi verset for deg selv — vis det så og se hvordan det gikk.
          </p>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--fag) 16%, transparent)',
              color: 'var(--fag-teologi)',
            }}
          >
            <Eye className="h-4 w-4" />
            Vis verset
          </button>
        </>
      ) : (
        <div className="animate-fade-in">
          <blockquote className="mt-4 font-display text-xl leading-relaxed text-[var(--color-ivory)] sm:text-2xl">
            «{verse.text}»
          </blockquote>
          <p className="mt-3 text-xs text-[var(--color-muted)]">{verse.rights.source}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onResult(true)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                'bg-[var(--color-sea)] text-[var(--color-ink-on-sea)] hover:opacity-90',
              )}
            >
              <Check className="h-4 w-4" />
              Husket
            </button>
            <button
              type="button"
              onClick={() => onResult(false)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
            >
              <X className="h-4 w-4" />
              Husket ikke
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
