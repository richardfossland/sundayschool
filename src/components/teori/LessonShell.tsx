import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { AppShell } from '@/components/AppShell'

// ── LessonShell ───────────────────────────────────────────────────────────────
// Layout for one theory lesson: fag-header, a column of prose sections with
// interactive demos in between (all passed as children), and prev/next lesson
// navigation. No hooks — stays server-renderable; the demos inside are the
// client components.

export interface LessonLink {
  href: string
  label: string
}

interface Props {
  title: string
  intro: string
  prev?: LessonLink
  next?: LessonLink
  children: React.ReactNode
}

export function LessonShell({ title, intro, prev, next, children }: Props) {
  return (
    <AppShell>
      <main
        className="mx-auto max-w-3xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-teori)' }}
      >
        <Link
          href="/teori"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Teori
        </Link>

        <header className="mt-3 mb-8">
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
              Teori · Leksjon
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">{title}</h1>
          <p className="mt-2 text-[var(--color-muted)]">{intro}</p>
        </header>

        <div className="space-y-8">{children}</div>

        {/* Prev/next lesson navigation */}
        <nav className="mt-12 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6">
          {prev ? (
            <Link
              href={prev.href}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-surface)]"
            >
              <ArrowLeft className="h-4 w-4" />
              {prev.label}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.href}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-surface)]"
            >
              {next.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/gehor"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-surface)]"
            >
              Øv med gehørtrening
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </nav>
      </main>
    </AppShell>
  )
}

/** One prose section of a lesson — a heading plus paragraphs. */
export function LessonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl text-[var(--color-ivory)]">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed text-[var(--color-muted)]">{children}</div>
    </section>
  )
}
