import Link from 'next/link'
import { Construction, ArrowLeft } from 'lucide-react'
import type { Subject } from '@/lib/subjects'
import { AppShell } from '@/components/AppShell'

// ── FagUnderConstruction ──────────────────────────────────────────────────────
// The shared skeleton every not-yet-built subject renders. Wave 1 replaces the
// body (the "Under bygging"-card) with the real fag content, but keeps this
// header/shell so all subjects share one structure. Accent is the subject's
// --fag-* colour, applied inline.

export function FagUnderConstruction({ subject }: { subject: Subject }) {
  const { icon: Icon, label, tagline, accent } = subject

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12" style={{ ['--fag' as string]: accent }}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Skolen
        </Link>

        <header className="mt-3 mb-8">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: accent,
              }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · {label}
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">{label}</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">{tagline}</p>
        </header>

        {/* Under bygging */}
        <div
          className="rounded-2xl border border-dashed px-6 py-16 text-center"
          style={{ borderColor: 'color-mix(in srgb, var(--fag) 45%, transparent)' }}
        >
          <span
            aria-hidden
            className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
              color: accent,
            }}
          >
            <Construction className="h-6 w-6" />
          </span>
          <p className="font-display text-xl text-[var(--color-ivory)]">Under bygging</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">
            {label} åpner snart. Vi bygger faget nå — Piano er allerede klart å øve på.
          </p>
          <Link
            href="/piano"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-surface)]"
          >
            Åpne Piano
          </Link>
        </div>
      </main>
    </AppShell>
  )
}
