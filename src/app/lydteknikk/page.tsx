import Link from 'next/link'
import { ArrowLeft, ArrowRight, SlidersHorizontal } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { LESSONS } from './lessons'

// ── Lydteknikk — fag-forside ──────────────────────────────────────────────────
// The sound-tech subject's home: a fag-header, one card per lesson in teaching
// order, plus a highlighted "Åpne miksepulten"-card that jumps straight to the
// standalone mixing desk. Modelled on the Teori overview.

export default function LydteknikkPage() {
  return (
    <AppShell>
      <main
        className="mx-auto max-w-5xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-lydteknikk)' }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Skolen
        </Link>

        <header className="mt-3 mb-7">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: 'var(--fag)',
              }}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Lydteknikk
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            Lydteknikk
          </h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            For dere som står bak mikserbordet på søndag. Fire korte leksjoner om gain-struktur, EQ,
            monitor og lydsjekk — med en interaktiv miksepult du kan øve på uten å ødelegge noe.
          </p>
        </header>

        {/* Miksepult-kort */}
        <Link
          href="/lydteknikk/miksepult"
          className="group mb-3 flex items-center gap-4 rounded-2xl border p-5 transition-colors"
          style={{
            borderColor: 'color-mix(in srgb, var(--fag) 45%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--fag) 8%, var(--color-surface))',
          }}
        >
          <span
            aria-hidden
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--fag) 18%, transparent)',
              color: 'var(--fag)',
            }}
          >
            <SlidersHorizontal className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-xl text-[var(--color-ivory)]">Åpne miksepulten</h2>
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">
              Tre kanaler, EQ, monitor-send og master — spill bandet og øv i nettleseren.
            </p>
          </div>
          <ArrowRight
            className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5"
            style={{ color: 'var(--fag)' }}
          />
        </Link>

        <ol className="grid gap-3 sm:grid-cols-2">
          {LESSONS.map((lesson, i) => (
            <li key={lesson.slug}>
              <Link
                href={`/lydteknikk/${lesson.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[color-mix(in_srgb,var(--fag)_45%,transparent)]"
              >
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  Leksjon {i + 1}
                </span>
                <h2 className="mt-1.5 font-display text-xl text-[var(--color-ivory)]">
                  {lesson.title}
                </h2>
                <p className="mt-1.5 flex-1 text-sm text-[var(--color-muted)]">{lesson.tagline}</p>
                <span
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--fag)' }}
                >
                  Start leksjonen
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </AppShell>
  )
}
