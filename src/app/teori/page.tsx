import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { LESSONS } from './lessons'

// ── Teori — fag-forside ───────────────────────────────────────────────────────
// The theory subject's home: a fag-header plus one card per lesson, in teaching
// order. Each card links to /teori/[leksjon].

export default function TeoriPage() {
  return (
    <AppShell>
      <main
        className="mx-auto max-w-5xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-teori)' }}
      >
        <header className="mb-7">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: 'var(--fag)',
              }}
            >
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Teori
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Teori</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Fire korte leksjoner som gir deg språket bak salmene og lovsangene: intervaller,
            akkorder, kvintsirkelen og tonearter. Les, lytt og prøv selv underveis.
          </p>
        </header>

        <ol className="grid gap-3 sm:grid-cols-2">
          {LESSONS.map((lesson, i) => (
            <li key={lesson.slug}>
              <Link
                href={`/teori/${lesson.slug}`}
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
