import Link from 'next/link'
import { ArrowDownWideNarrow, SlidersHorizontal, ShieldCheck, ArrowRight } from 'lucide-react'
import { AppShell } from '@/components/AppShell'

const FEATURES = [
  {
    icon: ArrowDownWideNarrow,
    title: 'Fallende noter og vent-modus',
    body:
      'Notene faller mot tangentene i takt med musikken. Slå på vent-modus, så holder øvingen pusten til du treffer riktig tangent — helt uten stress.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Transponér til din toneart',
    body:
      'Flytt hele satsen til forsangerens toneart med ett trykk. Ekte notasjon og besifring følger med — ingen tidsstrekking, ingen kunstig lyd.',
  },
  {
    icon: ShieldCheck,
    title: 'Fritt og lovlig repertoar',
    body:
      'Salmer, hymner, spirituals og gospel med dokumenterte rettigheter — alle opphavere døde i god tid før 1956. Trygt å bruke i menigheten.',
  },
]

export default function Home() {
  return (
    <AppShell>
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-4 pb-16 pt-20 text-center sm:pt-28">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-amber)]" />
            Del av Sunday Suite
          </p>
          <h1 className="font-display text-4xl leading-tight text-[var(--color-ivory)] sm:text-6xl">
            Lær salmer på piano med{' '}
            <span className="text-[var(--color-amber)]">fallende noter</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]">
            Lær salmer, lovsang og gospel på piano — fallende noter, ekte notasjon
            og transponering til din toneart.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/bibliotek"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-amber)] px-7 py-3.5 text-base font-semibold text-[var(--color-ink-on-amber)] transition-transform hover:scale-[1.02]"
            >
              Åpne biblioteket
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/om-rettigheter"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-7 py-3.5 text-base font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-surface)]"
            >
              Om rettigheter
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <span
                  aria-hidden
                  className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-[var(--color-amber)]/12 text-[var(--color-amber)]"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="font-display text-xl text-[var(--color-ivory)]">{title}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-muted)]">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
