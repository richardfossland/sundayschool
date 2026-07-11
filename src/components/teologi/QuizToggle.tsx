'use client'

import { useState } from 'react'
import { BookOpen, HelpCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

// ── QuizToggle ────────────────────────────────────────────────────────────────
// Renders a catechism section's q/a items in one of two modes:
//   Les  — question and answer shown together, as running text.
//   Quiz — answers hidden behind a per-item "Vis svar" click, so the learner can
//          test themselves. The q/a data structure gives both modes for free.
// The mode toggle is local to each section, so a reader can quiz one part while
// reading another.

export function QuizToggle({ items }: { items: { q: string; a: string }[] }) {
  const [quiz, setQuiz] = useState(false)
  // Which items are revealed in quiz mode (index-keyed). Reset on mode switch.
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  const setMode = (toQuiz: boolean) => {
    setQuiz(toQuiz)
    setRevealed(new Set())
  }

  return (
    <div>
      {/* mode toggle */}
      <div
        className="inline-flex rounded-full border border-[var(--color-border)] p-1"
        role="group"
        aria-label="Visning"
      >
        {(
          [
            [false, 'Les', BookOpen],
            [true, 'Quiz', HelpCircle],
          ] as const
        ).map(([isQuiz, label, Icon]) => (
          <button
            key={label}
            type="button"
            onClick={() => setMode(isQuiz)}
            aria-pressed={quiz === isQuiz}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              quiz === isQuiz
                ? 'bg-[var(--color-raised)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
            )}
            style={quiz === isQuiz ? { color: 'var(--fag-teologi)' } : undefined}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((item, i) => {
          const shown = !quiz || revealed.has(i)
          return (
            <li
              key={i}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
            >
              <p className="font-medium leading-relaxed text-[var(--color-ivory)]">{item.q}</p>
              {shown ? (
                <p
                  className={cn(
                    'mt-2 leading-relaxed text-[var(--color-muted)]',
                    quiz && 'animate-fade-in',
                  )}
                >
                  {item.a}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealed((r) => new Set(r).add(i))}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--fag-teologi) 14%, transparent)',
                    color: 'var(--fag-teologi)',
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                  Vis svar
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
