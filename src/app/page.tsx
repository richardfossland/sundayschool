import { AppShell } from '@/components/AppShell'
import { SubjectCard } from '@/components/SubjectCard'
import { SUBJECTS } from '@/lib/subjects'

// ── Skolen — the school launcher ──────────────────────────────────────────────
// The front door to SundaySchool. Piano is live today; the other fag link to
// build-in-progress skeletons. Wave 2 makes this richer — kept clean and solid
// here. The old piano hero now lives on /piano.

export default function Home() {
  const primary = SUBJECTS.filter((s) => s.tier === 'primary')
  const secondary = SUBJECTS.filter((s) => s.tier === 'secondary')

  return (
    <AppShell>
      <main>
        {/* Intro */}
        <section className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pt-24">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-amber)]" />
            Del av Sunday Suite
          </p>
          <h1 className="font-display text-4xl leading-tight text-[var(--color-ivory)] sm:text-6xl">
            Lær musikk for menigheten — <span className="text-[var(--color-amber)]">én skole</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]">
            Velg et fag og øv med fallende noter, ekte notasjon og transponering. Piano er åpent nå —
            gitar, bass, trommer og mer er på vei.
          </p>
        </section>

        {/* Primary subjects */}
        <section className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {primary.map((s) => (
              <SubjectCard key={s.id} subject={s} size="lg" />
            ))}
          </div>
        </section>

        {/* Secondary subjects */}
        <section className="mx-auto max-w-5xl px-4 pb-24 pt-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {secondary.map((s) => (
              <SubjectCard key={s.id} subject={s} size="sm" />
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
