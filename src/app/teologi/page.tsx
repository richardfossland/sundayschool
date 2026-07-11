'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Church,
  ScrollText,
  BookMarked,
  MessageCircleQuestion,
  CalendarDays,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { CrossLinks } from '@/components/CrossLinks'
import { hymnStories, memoryVerses } from '@/lib/teologi/content'
import { dueVerses, loadSr, todayKey } from '@/lib/teologi/sr'

// ── Teologi — fag-forside ─────────────────────────────────────────────────────
// The theology subject's home: header + four module cards (Salmehistorier /
// Vers / Katekisme / Kirkeåret) and today's due-verse counter on the Vers card.
// Client component because the counter reads SR state from localStorage. The
// Salmehistorier card jumps to the article list further down the page (there is
// deliberately no separate index route for stories).

interface Module {
  href: string
  label: string
  icon: LucideIcon
  description: string
}

const MODULES: Module[] = [
  {
    href: '#salmehistorier',
    label: 'Salmehistorier',
    icon: ScrollText,
    description: 'Historien bak salmene du øver på — mennesker, tro og tid.',
  },
  {
    href: '/teologi/vers',
    label: 'Bibelvers',
    icon: BookMarked,
    description: 'Memorer kjernevers fra Bibelen (1930) med smart repetisjon.',
  },
  {
    href: '/teologi/katekisme',
    label: 'Katekisme og bekjennelse',
    icon: MessageCircleQuestion,
    description: 'Luthers lille katekisme i lese- og quizmodus, med trosbekjennelsene.',
  },
  {
    href: '/teologi/kirkearet',
    label: 'Kirkeåret',
    icon: CalendarDays,
    description: 'Fra advent til domssøndag — farger, temaer og sanger som passer.',
  },
]

export default function TeologiPage() {
  // null until mounted so SSR and first client render agree (no hydration diff).
  const [dueCount, setDueCount] = useState<number | null>(null)
  useEffect(() => {
    const ids = memoryVerses.map((v) => v.id)
    setDueCount(dueVerses(loadSr(), todayKey(), ids).length)
  }, [])

  return (
    <AppShell>
      <main
        className="mx-auto max-w-5xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-teologi)' }}
      >
        <header className="mb-8">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: 'var(--fag-teologi)',
              }}
            >
              <Church className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Teologi
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            Teologi
          </h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Søndagsskolen for voksne og ungdom: historien bak salmene, bibelvers å bære med seg,
            katekismen og kirkeårets rytme.
          </p>
        </header>

        {/* module cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map(({ href, label, icon: Icon, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--fag)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                    color: 'var(--fag-teologi)',
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {href === '/teologi/vers' && dueCount !== null && dueCount > 0 && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--fag) 16%, transparent)',
                      color: 'var(--fag-teologi)',
                    }}
                  >
                    {dueCount} vers i dag
                  </span>
                )}
              </div>
              <h2 className="mt-4 font-display text-xl text-[var(--color-ivory)]">{label}</h2>
              <p className="mt-1.5 text-sm text-[var(--color-muted)]">{description}</p>
              <span
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: 'var(--fag-teologi)' }}
              >
                Åpne
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        {/* article list — the Salmehistorier card's target */}
        <section id="salmehistorier" className="mt-12 scroll-mt-20">
          <h2 className="font-display text-2xl text-[var(--color-ivory)]">Salmehistorier</h2>
          <p className="mt-1.5 max-w-xl text-sm text-[var(--color-muted)]">
            Én artikkel per sang i repertoaret. Les historien — og øv sangen etterpå på Piano.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {/* amazing-grace-firstemmig shares its article with amazing-grace —
                list each unique article once (dedupe on title). */}
            {hymnStories
              .filter((s, i, arr) => arr.findIndex((x) => x.title === s.title) === i)
              .map((story) => (
              <li key={story.songSlug}>
                <Link
                  href={`/teologi/salmehistorie/${story.songSlug}`}
                  className="group flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--fag)]"
                >
                  <span className="font-medium leading-snug text-[var(--color-ivory)]">
                    {story.title}
                  </span>
                  <span
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: 'var(--fag-teologi)' }}
                  >
                    Les artikkelen
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
              ))}
          </ul>
        </section>

        <CrossLinks
          title="Øv sangene"
          links={[
            { href: '/piano', label: 'Til sangbiblioteket på piano' },
            { href: '/teologi/kirkearet', label: 'Se kirkeåret' },
          ]}
        />
      </main>
    </AppShell>
  )
}
