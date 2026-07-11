'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { currentSeasonId } from '@/lib/teologi/current-season'

// ── ChurchSeasonHint — kirkeårs-hint ──────────────────────────────────────────
// A quiet banner on the school front page: "Nå er det <periode> — passende
// salmer: …", with the liturgical colour as a dot and links to fitting songs.
// The current season depends on today's date, which the server can't know
// without risking a hydration mismatch — so this is a client component that
// renders null until mounted, then picks the season from the (serialisable)
// list the server passed. The date logic itself lives in the pure, tested
// current-season helper; the season CONTENT is passed as props so this bundle
// never pulls in the full teologi data.

export interface SeasonHintData {
  id: string
  label: string
  colorName: string
  hex: string
  songs: { slug: string; title: string }[]
}

export function ChurchSeasonHint({ seasons }: { seasons: SeasonHintData[] }) {
  const [seasonId, setSeasonId] = useState<string | null>(null)
  useEffect(() => {
    setSeasonId(currentSeasonId())
  }, [])

  if (!seasonId) return null
  const season = seasons.find((s) => s.id === seasonId)
  if (!season) return null

  return (
    <section className="mx-auto max-w-5xl px-4 py-2">
      <div
        style={{ ['--fag' as string]: 'var(--fag-teologi)' }}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:flex sm:items-center sm:gap-5"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
              color: 'var(--fag)',
            }}
          >
            <CalendarDays className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              I kirkeåret nå
            </p>
            <p className="mt-1 flex items-center gap-2 font-display text-lg text-[var(--color-ivory)]">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/20"
                style={{ backgroundColor: season.hex }}
                title={season.colorName}
              />
              {season.label}
            </p>
            {season.songs.length > 0 && (
              <p className="mt-1.5 text-sm text-[var(--color-muted)]">
                Passende salmer å øve på nå:{' '}
                {season.songs.map((song, i) => (
                  <span key={song.slug}>
                    {i > 0 && ', '}
                    <Link
                      href={`/piano/sang/${song.slug}`}
                      className="font-medium text-[var(--fag)] underline-offset-2 hover:underline"
                    >
                      {song.title}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/teologi/kirkearet"
          className="mt-4 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--fag)] transition-opacity hover:opacity-90 sm:mt-0"
        >
          Se hele kirkeåret
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
