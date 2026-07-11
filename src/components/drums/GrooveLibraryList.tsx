'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Music4 } from 'lucide-react'
import type { Groove } from '@/lib/drums/types'
import { GROOVES, FILLS } from '@/data/grooves'
import { getProgress, type Progress } from '@/lib/progress'
import { cn } from '@/lib/cn'

// ── GrooveLibraryList — the /trommer groove browser ──────────────────────────
// Card grids for the groove library and the fill library. Progress badges read
// the `trommer:groove:{id}` keys written by GroovePlayer. Mirrors the visual
// language of SongLibraryList so the fag pages feel like one app.

const DIFFICULTY_LABEL: Record<1 | 2 | 3, string> = {
  1: 'Enkel',
  2: 'Middels',
  3: 'Avansert',
}

const EMPTY_PROGRESS: Progress = {
  practiced: [],
  bestBpm: {},
  lastPracticed: {},
  sectionPracticed: [],
  sectionBestBpm: {},
}

function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span aria-label={`Vanskelighet ${level} av 3`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            i <= level ? 'bg-[var(--color-amber)]' : 'bg-[var(--color-border)]',
          )}
        />
      ))}
    </span>
  )
}

function GrooveCard({
  groove,
  practiced,
  bestBpm,
}: {
  groove: Groove
  practiced: boolean
  bestBpm?: number
}) {
  return (
    <Link
      href={`/trommer/groove/${groove.id}`}
      className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-amber)]/50"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full bg-[var(--color-raised)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
          {DIFFICULTY_LABEL[groove.difficulty]}
        </span>
        {practiced && (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-sea)]"
            title={bestBpm ? `Øvd — beste ${bestBpm} BPM` : 'Øvd'}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Øvd
          </span>
        )}
      </div>

      <h3 className="font-display text-xl leading-snug text-[var(--color-ivory)] group-hover:text-[var(--color-amber)]">
        {groove.label}
      </h3>

      <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-[var(--color-muted)]">
        <DifficultyDots level={groove.difficulty} />
        <span aria-hidden className="h-3 w-px bg-[var(--color-border)]" />
        <span className="inline-flex items-center gap-1">
          <Music4 className="h-3.5 w-3.5" />
          {groove.timeSignature}
        </span>
        <span aria-hidden className="h-3 w-px bg-[var(--color-border)]" />
        <span>{groove.bpmDefault} BPM</span>
      </div>
    </Link>
  )
}

export function GrooveLibraryList() {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS)
  useEffect(() => setProgress(getProgress()), [])

  const grid = (items: Groove[]) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((g) => {
        const key = `trommer:groove:${g.id}`
        return (
          <GrooveCard
            key={g.id}
            groove={g}
            practiced={progress.practiced.includes(key)}
            bestBpm={progress.bestBpm[key]}
          />
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 font-display text-2xl text-[var(--color-ivory)]">Grooves</h2>
        {grid(GROOVES)}
      </section>
      <section>
        <h2 className="mb-1 font-display text-2xl text-[var(--color-ivory)]">Fills</h2>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          Én-takts fyll — de samme som dukker opp før delskifter når du spiller til en sang.
        </p>
        {grid(FILLS)}
      </section>
    </div>
  )
}
