'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProgress } from '@/lib/progress'
import { recentItems, type ResolvedItem } from '@/lib/continue-resolve'

// ── ContinueLearning — "Fortsett der du slapp" ────────────────────────────────
// Reads local practice progress and surfaces the (up to) three most recently
// practised items, each linking straight back to where the learner was. Renders
// nothing on the server and nothing until mounted (localStorage is client-only),
// and nothing when there is no history — so a first-time visit stays clean.
//
// Titles for songs, grooves and lessons can't be derived from a progress key
// alone, so the server passes lightweight slug→title maps as props (keeping the
// heavy song docs out of this client bundle). The key→card mapping itself lives
// in lib/continue-resolve.ts, where it is unit-tested per fag.

export function ContinueLearning({
  songTitles,
  grooveTitles,
  lessonTitles,
}: {
  songTitles: Record<string, string>
  grooveTitles: Record<string, string>
  lessonTitles: Record<string, string>
}) {
  const [items, setItems] = useState<ResolvedItem[] | null>(null)

  useEffect(() => {
    setItems(recentItems(getProgress(), { songTitles, grooveTitles, lessonTitles }))
  }, [songTitles, grooveTitles, lessonTitles])

  if (!items || items.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-4 pb-4 pt-2">
      <h2 className="mb-4 font-display text-xl text-[var(--color-ivory)] sm:text-2xl">
        Fortsett der du slapp
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            style={{ ['--fag' as string]: item.accent }}
            className="group flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--fag)]"
          >
            <span
              aria-hidden
              className="h-9 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.accent }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-[var(--color-ivory)]">
                {item.label}
              </span>
              <span className="block text-xs text-[var(--color-muted)]">{item.sub}</span>
            </span>
            <ArrowRight
              aria-hidden
              className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}
