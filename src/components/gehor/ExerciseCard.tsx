'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Volume2 } from 'lucide-react'
import type { Level } from '@/lib/gehor/exercises'
import { cn } from '@/lib/cn'

// ── ExerciseCard ──────────────────────────────────────────────────────────────
// One ear-training task: a (re-hearable) play button, session progress, a level
// selector, and EITHER multiple-choice answer buttons (interval/chord quality)
// OR a custom answer surface passed as children (melody dictation with
// AnswerKeyboard). Feedback is green/red on the chosen button; «Neste» advances.

export interface CardOption {
  id: string
  label: string
}

interface Props {
  /** Session progress, 1-based (e.g. oppgave 3 av 10). */
  progress: { current: number; total: number }
  level: Level
  /** Changing level restarts the session (the parent owns that). */
  onLevelChange: (level: Level) => void
  /** (Re)play the current task's audio. */
  onPlay: () => void
  playLabel?: string
  /** Multiple-choice mode: the buttons + which id is correct. */
  options?: CardOption[]
  correctId?: string
  /** Called once per task, when the learner answers (multiple-choice mode). */
  onAnswered?: (correct: boolean) => void
  /** Children mode (melody dictation): non-null message = task answered. */
  answeredMessage?: string | null
  onNext: () => void
  isLast: boolean
  children?: React.ReactNode
}

export function ExerciseCard({
  progress,
  level,
  onLevelChange,
  onPlay,
  playLabel = 'Spill',
  options,
  correctId,
  onAnswered,
  answeredMessage,
  onNext,
  isLast,
  children,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // New task → clear the local answer state.
  useEffect(() => {
    setSelectedId(null)
  }, [progress.current])

  const answered = options ? selectedId !== null : answeredMessage != null
  const correct = selectedId !== null && selectedId === correctId

  const choose = (id: string) => {
    if (selectedId !== null) return
    setSelectedId(id)
    onAnswered?.(id === correctId)
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      {/* Progress + level */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--color-muted)]">
          Oppgave <span className="font-medium text-[var(--color-ivory)]">{progress.current}</span> av{' '}
          {progress.total}
        </p>
        <div className="flex items-center gap-1" role="group" aria-label="Nivå">
          {([1, 2, 3] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLevelChange(l)}
              aria-pressed={l === level}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                l === level
                  ? 'border-transparent bg-[var(--fag-gehor)] text-[var(--color-scene)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
              )}
            >
              Nivå {l}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-raised)]">
        <div
          className="h-full rounded-full bg-[var(--fag-gehor)] transition-all"
          style={{ width: `${((progress.current - 1) / progress.total) * 100}%` }}
        />
      </div>

      {/* Play */}
      <button
        type="button"
        onClick={onPlay}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--fag-gehor)] px-5 py-2.5 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
      >
        <Volume2 className="h-4 w-4" />
        {playLabel}
      </button>

      {/* Answers */}
      {options && (
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((o) => {
            const isSelected = o.id === selectedId
            const showCorrect = answered && o.id === correctId
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => choose(o.id)}
                disabled={answered}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  showCorrect
                    ? 'border-transparent bg-[#6BD08A] text-[var(--color-scene)]'
                    : isSelected
                      ? 'border-transparent bg-[var(--color-danger)] text-[var(--color-ivory)]'
                      : answered
                        ? 'border-[var(--color-border)] text-[var(--color-muted)] opacity-60'
                        : 'border-[var(--color-border)] text-[var(--color-ivory)] hover:bg-[var(--color-raised)]',
                )}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}

      {/* Feedback + next */}
      {answered && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p
            className={cn(
              'text-sm font-medium',
              options ? (correct ? 'text-[#6BD08A]' : 'text-[var(--color-danger)]') : 'text-[var(--color-ivory)]',
            )}
          >
            {options ? (correct ? 'Riktig!' : 'Feil — riktig svar er markert.') : answeredMessage}
          </p>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
          >
            {isLast ? 'Se resultat' : 'Neste'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
