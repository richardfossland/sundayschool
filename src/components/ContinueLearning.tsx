'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getProgress } from '@/lib/progress'
import { SUBJECT_BY_ID, type SubjectId } from '@/lib/subjects'

// ── ContinueLearning — "Fortsett der du slapp" ────────────────────────────────
// Reads local practice progress and surfaces the (up to) three most recently
// practised items, each linking straight back to where the learner was. Renders
// nothing on the server and nothing until mounted (localStorage is client-only),
// and nothing when there is no history — so a first-time visit stays clean.
//
// Titles for songs and grooves can't be derived from a progress key alone, so
// the server passes lightweight slug→title / id→label maps as props (keeping the
// heavy song docs out of this client bundle).

interface ResolvedItem {
  key: string
  label: string
  sub: string
  href: string
  accent: string
  date: string
}

const GEHOR_TYPE_LABEL: Record<string, string> = {
  intervall: 'Intervaller',
  akkord: 'Akkordkvalitet',
  melodi: 'Melodidiktat',
}

/** Turn a subject-prefixed progress key into a display item, or null if the key
 * shape isn't one we can link. `date` is the last-practiced day (for sorting). */
function resolve(
  key: string,
  date: string,
  songTitles: Record<string, string>,
  grooveTitles: Record<string, string>,
): ResolvedItem | null {
  const colon = key.indexOf(':')
  if (colon === -1) return null
  const fag = key.slice(0, colon) as SubjectId
  const rest = key.slice(colon + 1)
  const subject = SUBJECT_BY_ID[fag]
  if (!subject) return null
  const accent = subject.accent
  const base = { key, accent, date }

  // Instrument songs: {fag}:{slug} → the fag's player for that song.
  if (fag === 'piano' || fag === 'gitar' || fag === 'bass') {
    return { ...base, label: songTitles[rest] ?? rest, sub: subject.label, href: `/${fag}/sang/${rest}` }
  }

  if (fag === 'trommer') {
    // Two shapes: trommer:groove:{id} and trommer:{slug}.
    if (rest.startsWith('groove:')) {
      const id = rest.slice('groove:'.length)
      return { ...base, label: grooveTitles[id] ?? id, sub: 'Trommer · Groove', href: `/trommer/groove/${id}` }
    }
    return { ...base, label: songTitles[rest] ?? rest, sub: 'Trommer', href: `/trommer/sang/${rest}` }
  }

  if (fag === 'gehor') {
    // gehor:{type}-{level}
    const dash = rest.lastIndexOf('-')
    const type = dash === -1 ? rest : rest.slice(0, dash)
    const level = dash === -1 ? '' : rest.slice(dash + 1)
    const typeLabel = GEHOR_TYPE_LABEL[type] ?? 'Gehør'
    return { ...base, label: typeLabel, sub: level ? `Gehør · Nivå ${level}` : 'Gehør', href: '/gehor' }
  }

  if (fag === 'teologi') {
    return { ...base, label: 'Bibelvers', sub: 'Teologi', href: '/teologi/vers' }
  }

  return null
}

export function ContinueLearning({
  songTitles,
  grooveTitles,
}: {
  songTitles: Record<string, string>
  grooveTitles: Record<string, string>
}) {
  const [items, setItems] = useState<ResolvedItem[] | null>(null)

  useEffect(() => {
    const p = getProgress()
    // Order among same-day entries: later in `practiced` = more recently added.
    const order = new Map(p.practiced.map((k, i) => [k, i]))
    const resolved = Object.entries(p.lastPracticed)
      .map(([key, date]) => resolve(key, date, songTitles, grooveTitles))
      .filter((r): r is ResolvedItem => r !== null)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1
        return (order.get(b.key) ?? -1) - (order.get(a.key) ?? -1)
      })
      .slice(0, 3)
    setItems(resolved)
  }, [songTitles, grooveTitles])

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
