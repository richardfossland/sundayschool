import Link from 'next/link'
import { Music } from 'lucide-react'
import type { ChurchSeason } from '@/types/teologi'
import { seasonColorParts } from '@/lib/teologi/content'

// ── SeasonCard ────────────────────────────────────────────────────────────────
// One period of the church year: a card with the liturgical colour as a left
// stripe + swatch, the period/description/themes, and links from the season's
// songSlugs into the piano repertoire (/piano/sang/[slug]). Pure presentation —
// song titles are passed in so this stays a server-renderable component that
// never imports the song docs.

export function SeasonCard({
  season,
  songTitles,
}: {
  season: ChurchSeason
  /** slug → title for the season's songSlugs (missing slugs are skipped). */
  songTitles: Record<string, string>
}) {
  const { name, hex } = seasonColorParts(season.color)
  const songs = season.songSlugs
    .filter((slug) => songTitles[slug])
    .map((slug) => ({ slug, title: songTitles[slug] }))

  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 pl-6"
      style={{ ['--lit' as string]: hex }}
    >
      {/* liturgical colour stripe */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: hex }} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-[var(--color-ivory)]">{season.label}</h3>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{season.period}</p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-[var(--color-ivory)]"
          style={{ backgroundColor: 'color-mix(in srgb, var(--lit) 22%, transparent)' }}
        >
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full border border-[var(--color-border)]"
            style={{ backgroundColor: hex }}
          />
          {name}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{season.description}</p>

      <p className="mt-3 text-xs text-[var(--color-muted)]">{season.themes.join(' · ')}</p>

      {songs.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {songs.map(({ slug, title }) => (
            <li key={slug}>
              <Link
                href={`/piano/sang/${slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
              >
                <Music className="h-3.5 w-3.5" style={{ color: 'var(--fag-teologi)' }} />
                {title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
