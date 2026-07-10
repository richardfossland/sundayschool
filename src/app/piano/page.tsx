import Link from 'next/link'
import { Piano, FileMusic } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { SongLibraryList } from '@/components/SongLibraryList'

// ── Piano — fag-forside ───────────────────────────────────────────────────────
// The piano subject's home: a small fag-header over the shared song library
// (the old /bibliotek content). Cards link to /piano/sang/[slug]; progress
// badges read the `piano:` prefixed keys.

export default function PianoPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-7">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag-piano) 14%, transparent)',
                color: 'var(--fag-piano)',
              }}
            >
              <Piano className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Piano
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Piano</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Bla i repertoaret av salmer, hymner, spirituals og gospel. Velg en sang for å øve med
            fallende noter — eller last inn din egen MIDI.
          </p>
          <Link
            href="/piano/egen-midi"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-surface)]"
          >
            <FileMusic className="h-4 w-4" />
            Egen MIDI
          </Link>
        </header>

        <SongLibraryList hrefBase="/piano/sang" />
      </main>
    </AppShell>
  )
}
