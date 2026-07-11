import Link from 'next/link'
import { ArrowLeft, MessageCircleQuestion } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { QuizToggle } from '@/components/teologi/QuizToggle'
import { catechismSections, creeds } from '@/lib/teologi/content'

// ── Katekisme og trosbekjennelser ─────────────────────────────────────────────
// The five chief parts of Luther's Small Catechism, each rendered by QuizToggle
// (read-mode ↔ self-quiz), followed by the creeds as a section at the bottom
// (DECISION: no sub-routes — the creeds are two short texts and belong on the
// same page). Rights/source lines are shown per section.

export default function KatekismePage() {
  return (
    <AppShell>
      <main
        className="mx-auto max-w-3xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-teologi)' }}
      >
        <Link
          href="/teologi"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Teologi
        </Link>

        <header className="mt-3 mb-10">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: 'var(--fag-teologi)',
              }}
            >
              <MessageCircleQuestion className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Teologi · Katekisme
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            Luthers lille katekisme
          </h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            De fem hovedstykkene i lese- eller quizmodus — bytt visning i hver del. Nederst finner
            du trosbekjennelsene.
          </p>
        </header>

        <div className="space-y-12">
          {catechismSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <p
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: 'var(--fag-teologi)' }}
              >
                Hovedstykke {section.part}
              </p>
              <h2 className="mt-1 font-display text-2xl text-[var(--color-ivory)]">
                {section.title}
              </h2>
              {section.intro && (
                <p className="mt-2 max-w-xl text-sm text-[var(--color-muted)]">{section.intro}</p>
              )}
              <div className="mt-4">
                <QuizToggle items={section.items} />
              </div>
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                {section.rights.source}
                {section.rights.modernized ? ' · ortografi varsomt modernisert' : ''}
              </p>
            </section>
          ))}
        </div>

        {/* trosbekjennelser */}
        <section id="trosbekjennelser" className="mt-16 scroll-mt-20">
          <h2 className="font-display text-2xl text-[var(--color-ivory)]">Trosbekjennelsene</h2>
          <p className="mt-2 max-w-xl text-sm text-[var(--color-muted)]">
            Kirkens felles bekjennelser, i 1920-alterbokens språkform lett modernisert. Den
            athanasianske trosbekjennelsen er utelatt her — den er svært lang og brukes sjelden i
            gudstjenesten.
          </p>
          <div className="mt-5 space-y-4">
            {creeds.map((creed) => (
              <article
                key={creed.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6"
              >
                <h3 className="font-display text-xl text-[var(--color-ivory)]">{creed.title}</h3>
                <div className="mt-3 space-y-3">
                  {creed.text.map((paragraph, i) => (
                    <p key={i} className="leading-relaxed text-[var(--color-ivory)]/85">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <p className="mt-4 text-xs text-[var(--color-muted)]">
                  {creed.rights.source}
                  {creed.rights.modernized ? ' · språkform lett modernisert' : ''}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
