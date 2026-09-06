'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, ShieldCheck, FileMusic } from 'lucide-react'
import type { Song } from '@/types/song'
import { SongPlayerLazy } from '@/components/SongPlayerLazy'
import { AppShell } from '@/components/AppShell'
import { cn } from '@/lib/cn'

// Import a local MIDI file and practise it. The file is parsed entirely in the
// browser (see lib/midi-import) — nothing is uploaded. Three states: the
// dropzone, an error with the reasons, and the player for the generated song.

type State =
  | { status: 'idle' }
  | { status: 'parsing' }
  | { status: 'error'; error: string; problems?: string[] }
  | { status: 'ready'; song: Song }

export default function EgenMidiPage() {
  const [state, setState] = useState<State>({ status: 'idle' })
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // The MIDI parser (@tonejs/midi + the song-format schema) is pulled in with
  // the file, not with the page: until someone actually drops a .mid there is
  // nothing to parse, and this route's first paint is a dropzone. The «Leser
  // filen …» state already covers the wait.
  const handleFile = useCallback(async (file: File) => {
    setState({ status: 'parsing' })
    const { importMidiFile } = await import('@/lib/midi-import')
    const result = await importMidiFile(file)
    if (result.ok) setState({ status: 'ready', song: result.song })
    else setState({ status: 'error', error: result.error, problems: result.problems })
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) void handleFile(file)
    },
    [handleFile],
  )

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <Link
          href="/piano"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Piano
        </Link>

        <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Egen MIDI</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          Last inn en egen <code className="text-[var(--color-ivory)]">.mid</code>-fil og øv på den med
          fallende noter, klaviatur og øvemodus — akkurat som sangene i biblioteket.
        </p>

        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-sea)]/40 bg-[var(--color-sea)]/10 px-3.5 py-2 text-sm text-[var(--color-sea)]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Filen behandles kun i nettleseren din — ingenting lastes opp.
        </p>

        {state.status !== 'ready' && (
          <div className="mt-6">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors',
                dragging
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/10'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]',
              )}
            >
              <FileMusic className="h-10 w-10 text-[var(--color-muted)]" />
              <p className="text-[var(--color-ivory)]">
                Dra en MIDI-fil hit, eller
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-amber)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink-on-amber)] transition-transform active:scale-95"
              >
                <Upload className="h-4 w-4" />
                Velg fil
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".mid,.midi,audio/midi,audio/x-midi"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFile(file)
                  e.target.value = '' // allow re-selecting the same file
                }}
              />
              {state.status === 'parsing' && (
                <p className="text-sm text-[var(--color-muted)]">Leser filen …</p>
              )}
            </div>

            {state.status === 'error' && (
              <div className="mt-4 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4">
                <p className="font-medium text-[var(--color-danger)]">{state.error}</p>
                {state.problems && state.problems.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-sm text-[var(--color-muted)]">
                    {state.problems.slice(0, 8).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {state.status === 'ready' && (
          <div className="mt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl text-[var(--color-ivory)]">{state.song.title}</h2>
              <button
                onClick={() => setState({ status: 'idle' })}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
              >
                <Upload className="h-4 w-4" />
                Ny fil
              </button>
            </div>
            <SongPlayerLazy song={state.song} />
            <p className="mt-6 text-xs leading-relaxed text-[var(--color-muted)]">
              Automatisk omgjort fra MIDI (hånd-splitt, kvantisering og seksjoner er beste gjetning).
              Kontroller selv at innholdet er fritt å bruke.
            </p>
          </div>
        )}
      </main>
    </AppShell>
  )
}
