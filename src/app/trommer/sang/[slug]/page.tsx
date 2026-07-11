'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { Song } from '@/types/song'
import { fetchSong } from '@/lib/songs'
import { DrumsPlayerLazy } from '@/components/drums/DrumsPlayerLazy'
import { AppShell } from '@/components/AppShell'

// Play drums to a song — same load pattern as the piano song page (client-side
// fetch after mount, then the lazy player pulls in Tone.js browser-only). The
// drum track itself is generated from the song's doc inside DrumsPlayer.
type State = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; song: Song }

export default function TrommerSangPage() {
  const params = useParams<{ slug: string }>()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    fetchSong(params.slug).then((song) => {
      if (!alive) return
      setState(song ? { status: 'ready', song } : { status: 'missing' })
    })
    return () => {
      alive = false
    }
  }, [params.slug])

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {state.status === 'loading' && (
          <p className="py-24 text-center text-[var(--color-muted)]">Laster …</p>
        )}

        {state.status === 'missing' && (
          <div className="py-24 text-center">
            <h1 className="font-display text-2xl text-[var(--color-ivory)]">Fant ikke sangen</h1>
            <p className="mx-auto mt-2 max-w-sm text-[var(--color-muted)]">
              Sangen finnes ikke, eller er ikke publisert enda.
            </p>
            <Link
              href="/trommer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-surface)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Til trommer
            </Link>
          </div>
        )}

        {state.status === 'ready' && (
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
                {state.song.title}
              </h1>
              {state.song.subtitle && (
                <p className="mt-1 text-[var(--color-muted)]">{state.song.subtitle}</p>
              )}
            </div>

            <DrumsPlayerLazy song={state.song} />

            <p className="mt-6 text-xs leading-relaxed text-[var(--color-muted)]">
              Fritt repertoar — alle opphavere døde før 1956.{' '}
              <Link
                href="/om-rettigheter"
                className="text-[var(--color-amber)] underline-offset-2 hover:underline"
              >
                Se Om rettigheter.
              </Link>
            </p>
          </>
        )}
      </main>
    </AppShell>
  )
}
