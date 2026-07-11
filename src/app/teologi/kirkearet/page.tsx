import Link from 'next/link'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { SeasonCard } from '@/components/teologi/SeasonCard'
import { seasonsInOrder } from '@/lib/teologi/content'
import { seedSongs } from '@/data/songs'

// ── Kirkeåret ─────────────────────────────────────────────────────────────────
// The twelve periods of the church year as a timeline grid of SeasonCards, in
// calendar order (advent → domssøndag). Song links jump to /piano/sang/[slug].
// Server component — the slug→title map is built here from seedSongs so
// SeasonCard stays presentation-only.

const SONG_TITLES: Record<string, string> = Object.fromEntries(
  seedSongs.map((s) => [s.slug, s.title]),
)

export default function KirkearetPage() {
  return (
    <AppShell>
      <main
        className="mx-auto max-w-5xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-teologi)' }}
      >
        <Link
          href="/teologi"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Teologi
        </Link>

        <header className="mt-3 mb-8">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: 'var(--fag-teologi)',
              }}
            >
              <CalendarDays className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Teologi · Kirkeåret
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            Kirkeåret
          </h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Kirkens eget år begynner med advent og slutter med domssøndagen. Hver tid har sin
            liturgiske farge, sine temaer — og sanger fra repertoaret som passer.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {seasonsInOrder().map((season) => (
            <SeasonCard key={season.id} season={season} songTitles={SONG_TITLES} />
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-[var(--color-muted)]">
          Fargene følger vanlig norsk liturgisk tradisjon: fiolett for forberedelse og bot, hvitt
          for Kristus-høytidene, rødt for Åndens dager og grønt for veksttidene.
        </p>
      </main>
    </AppShell>
  )
}
