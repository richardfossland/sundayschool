import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { SubjectCard } from '@/components/SubjectCard'
import { ContinueLearning } from '@/components/ContinueLearning'
import { ChurchSeasonHint, type SeasonHintData } from '@/components/ChurchSeasonHint'
import { SUBJECTS } from '@/lib/subjects'
import { seedSongs } from '@/data/songs'
import { ALL_PATTERNS } from '@/data/grooves'
import { LESSONS } from './lydteknikk/lessons'
import { seasonsInOrder, seasonColorParts } from '@/lib/teologi/content'

// ── Skolen — the school front page ────────────────────────────────────────────
// The rich front door to SundaySchool (Skolen v2, wave 2). A server component
// that assembles everything and hands lightweight, serialisable data to the two
// client sections — "Fortsett der du slapp" (reads localStorage) and the
// kirkeårs-hint (date-dependent). All seven subjects are live; the heavy song
// docs and full teologi data stay on the server — only strings cross to the
// client bundle.

// slug → title / id → label maps, built server-side so the client "Fortsett"
// section can name songs and grooves without importing their heavy data.
// This is a SERVER component, so reading the seed library here costs the client
// nothing — only the resulting slug→title strings cross the boundary.
const songTitles: Record<string, string> = Object.fromEntries(
  seedSongs.map((s) => [s.slug, s.title]),
)
const grooveTitles: Record<string, string> = Object.fromEntries(
  ALL_PATTERNS.map((g) => [g.id, g.label]),
)
const lessonTitles: Record<string, string> = Object.fromEntries(
  LESSONS.map((l) => [l.slug, l.title]),
)

// The church-year seasons, reduced to what the hint banner needs (colour parsed,
// song titles resolved) so ChurchSeasonHint never pulls in the teologi data.
const seasonHints: SeasonHintData[] = seasonsInOrder().map((s) => {
  const { name, hex } = seasonColorParts(s.color)
  return {
    id: s.id,
    label: s.label,
    colorName: name,
    hex,
    songs: s.songSlugs.map((slug) => ({ slug, title: songTitles[slug] ?? slug })),
  }
})

export default function Home() {
  const primary = SUBJECTS.filter((s) => s.tier === 'primary')
  const secondary = SUBJECTS.filter((s) => s.tier === 'secondary')

  return (
    <AppShell>
      <main className="pb-24">
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center sm:pt-24">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-amber)]" />
            Del av Sunday Suite
          </p>
          <h1 className="font-display text-4xl leading-tight text-[var(--color-ivory)] sm:text-6xl">
            Sunday<span className="text-[var(--color-amber)]">School</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]">
            Musikkskolen og søndagsskolen for menigheten — lær piano, gitar, bass og trommer, og gå
            dypere i troen.
          </p>
        </section>

        {/* Fortsett der du slapp — hidden when there's no history */}
        <ContinueLearning
          songTitles={songTitles}
          grooveTitles={grooveTitles}
          lessonTitles={lessonTitles}
        />

        {/* Primary subjects */}
        <section className="mx-auto max-w-5xl px-4 pt-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {primary.map((s) => (
              <SubjectCard key={s.id} subject={s} size="lg" />
            ))}
          </div>
        </section>

        {/* Secondary subjects */}
        <section className="mx-auto max-w-5xl px-4 pt-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {secondary.map((s) => (
              <SubjectCard key={s.id} subject={s} size="sm" />
            ))}
          </div>
        </section>

        {/* Kirkeårs-hint */}
        <div className="pt-6">
          <ChurchSeasonHint seasons={seasonHints} />
        </div>

        {/* Suite badge + footer */}
        <footer className="mx-auto mt-16 max-w-5xl border-t border-[var(--color-border)] px-4 pt-8 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-[var(--color-amber)]/15 text-[var(--color-amber)]">
              ♪
            </span>
            SundaySchool er en del av{' '}
            <span className="font-medium text-[var(--color-ivory)]">Sunday Suite</span>
          </p>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Fritt og lovlig repertoar.{' '}
            <Link
              href="/om-rettigheter"
              className="text-[var(--color-amber)] underline-offset-2 hover:underline"
            >
              Om rettigheter
            </Link>
          </p>
        </footer>
      </main>
    </AppShell>
  )
}
