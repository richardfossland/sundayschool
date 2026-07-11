import Link from 'next/link'
import { Drum } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { SongLibraryList } from '@/components/SongLibraryList'
import { GrooveLibraryList } from '@/components/drums/GrooveLibraryList'
import { CrossLinks } from '@/components/CrossLinks'

// ── Trommer — fag-forside ─────────────────────────────────────────────────────
// The drums subject's home: the groove/fill library on top (practice patterns),
// then the shared song library for playing drums TO a song. Cards link to
// /trommer/groove/[id] and /trommer/sang/[slug]; progress badges read the
// `trommer:` prefixed keys.

export default function TrommerPage() {
  return (
    <AppShell>
      <main
        className="mx-auto max-w-5xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-trommer)' }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
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
              <Drum className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Trommer
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            Trommer
          </h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Lær grooves og fills med fallende markører — på skjermpads eller et el-trommesett. Eller
            komp til en sang fra repertoaret med generert trommespor.
          </p>
        </header>

        <GrooveLibraryList />

        <section className="mt-10">
          <h2 className="mb-1 font-display text-2xl text-[var(--color-ivory)]">Spill til sanger</h2>
          <p className="mb-5 text-sm text-[var(--color-muted)]">
            Appen genererer et trommespor som passer sangens taktart og tempo — du komper med.
          </p>
          <SongLibraryList hrefBase="/trommer/sang" />
        </section>

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
