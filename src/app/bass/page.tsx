import { Music2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { SongLibraryList } from '@/components/SongLibraryList'
import { CrossLinks } from '@/components/CrossLinks'

// ── Bass — fag-forside ────────────────────────────────────────────────────────
// The bass subject's home: a fag-header over the shared song library. Cards
// link to /bass/sang/[slug]; progress badges read the `bass:` prefixed keys.
// The bassline itself is GENERATED from each song's chord track, so the whole
// repertoire is playable on bass from day one.

export default function BassPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-7">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag-bass) 14%, transparent)',
                color: 'var(--fag-bass)',
              }}
            >
              <Music2 className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Bass
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Bass</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Lær grunntoner, rot og kvint og vandrende gangbass til hele repertoaret. Basslinja
            genereres fra sangens besifring — velg nivå, se fallende toner mot gripebrettet, og
            øv i ditt eget tempo.
          </p>
        </header>

        <SongLibraryList hrefBase="/bass/sang" />

        <CrossLinks
          links={[
            { href: '/teori', label: 'Lær teorien bak' },
            { href: '/gehor', label: 'Tren gehøret' },
          ]}
        />
      </main>
    </AppShell>
  )
}
