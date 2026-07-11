import Link from 'next/link'
import { Guitar, ArrowLeft } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { SongLibraryList } from '@/components/SongLibraryList'
import { SUBJECT_BY_ID } from '@/lib/subjects'

// ── Gitar — fag-forside ───────────────────────────────────────────────────────
// The guitar subject's home: the shared song library over the same repertoire
// as piano. Cards link to /gitar/sang/[slug]; progress badges read the
// `gitar:` prefixed keys (derived from hrefBase). Header structure mirrors the
// fag skeleton this page replaces.

export default function GitarPage() {
  const subject = SUBJECT_BY_ID.gitar

  return (
    <AppShell>
      <main
        className="mx-auto max-w-5xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: subject.accent }}
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
                color: subject.accent,
              }}
            >
              <Guitar className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Gitar
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Gitar</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Samme repertoar som piano — men med grep, capo og rytmemønstre. Velg en sang for å øve
            med fallende akkorder, grep-diagrammer og strumming.
          </p>
        </header>

        <SongLibraryList hrefBase="/gitar/sang" />
      </main>
    </AppShell>
  )
}
