'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { grooveById } from '@/data/grooves'
import { GroovePlayerLazy } from '@/components/drums/GroovePlayerLazy'
import { AppShell } from '@/components/AppShell'

// Practise one groove/fill. Grooves are bundled data (no fetch): resolve the id
// synchronously and hand the pattern to the lazy player (Tone.js stays client-
// only). Missing id → the same "not found" treatment as the song pages.

export default function GroovePage() {
  const params = useParams<{ id: string }>()
  const groove = grooveById(params.id)

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {!groove ? (
          <div className="py-24 text-center">
            <h1 className="font-display text-2xl text-[var(--color-ivory)]">Fant ikke grooven</h1>
            <p className="mx-auto mt-2 max-w-sm text-[var(--color-muted)]">
              Grooven finnes ikke i biblioteket.
            </p>
            <Link
              href="/trommer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-surface)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Til trommer
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <Link
                href="/trommer"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Trommer
              </Link>
              <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
                {groove.label}
              </h1>
              <p className="mt-1 text-[var(--color-muted)]">
                {groove.timeSignature} · {groove.bpmDefault} BPM
              </p>
            </div>

            <GroovePlayerLazy groove={groove} />
          </>
        )}
      </main>
    </AppShell>
  )
}
