import Link from 'next/link'
import { ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { MikserSimLazy } from '@/components/lydteknikk/MikserSimLazy'

// ── /lydteknikk/miksepult ─────────────────────────────────────────────────────
// The standalone mixing desk — the same MikserSim used inside the lessons, on
// its own page so a volunteer can just open it and practise. Linked from the
// "Åpne miksepulten"-card on the fag overview and from the last lesson's CTA.

export default function MiksepultPage() {
  return (
    <AppShell>
      <main
        className="mx-auto max-w-3xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-lydteknikk)' }}
      >
        <Link
          href="/lydteknikk"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Lydteknikk
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
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Lydteknikk · Miksepult
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            Miksepulten
          </h1>
          <p className="mt-2 text-[var(--color-muted)]">
            Tre kanaler — trommer, bass og vokal — med fader, tre EQ-bånd, monitor-send og master.
            Trykk start, hør bandet, og øv på å balansere en miks uten å klippe. Alt spilles i
            nettleseren; ingenting sendes noe sted.
          </p>
        </header>

        <MikserSimLazy />

        <p className="mt-6 text-sm text-[var(--color-muted)]">
          Vil du ha forklaringene bak knappene? Gå gjennom{' '}
          <Link href="/lydteknikk" className="underline" style={{ color: 'var(--fag)' }}>
            de fire leksjonene
          </Link>
          .
        </p>
      </main>
    </AppShell>
  )
}
