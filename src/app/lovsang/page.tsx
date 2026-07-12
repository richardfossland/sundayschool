'use client'

import { useEffect, useMemo, useState } from 'react'
import { Mic, Plus, ListMusic, ChevronRight } from 'lucide-react'
import type { SongMeta } from '@/types/song'
import { AppShell } from '@/components/AppShell'
import { SetlistBuilder, type WorkOption } from '@/components/lovsang/SetlistBuilder'
import { FALLBACK_META, fetchSongs } from '@/lib/songs'
import { installAudioUnlock } from '@/lib/audio-unlock'
import {
  analyzeSetlist,
  createSetlist,
  deleteSetlist,
  loadSetlists,
  saveSetlist,
  type FlowRating,
  type Setlist,
} from '@/lib/lovsang/setlist'

// ── Lovsang — setliste-verksted ───────────────────────────────────────────────
// Fag-forsiden for lovsangsledere: mine setlister → bygg søndagens liste med
// toneartsflyt, overganger, «gi tonen» og intro-øving. Setlistene lagres per
// enhet i localStorage (lib/lovsang/setlist); intro-øving skriver framgang under
// `lovsang:intro-{workSlug}`. Verk grupperes på work_slug — vi viser verket, og
// bruker nivå-1-varianten (slug === work_slug) for toneart og avspilling.

const RATING_COLOR: Record<FlowRating, string> = {
  god: '#6BD08A',
  ok: 'var(--color-amber)',
  krevende: 'var(--color-danger)',
}
const RATING_LABEL: Record<FlowRating, string> = {
  god: 'God flyt',
  ok: 'Grei flyt',
  krevende: 'Krevende',
}

/** Bibliotekets verk = nivå-1-variantene (slug === work_slug). */
function toWorkOptions(metas: SongMeta[]): WorkOption[] {
  return metas
    .filter((m) => m.slug === m.work_slug)
    .map((m) => ({
      workSlug: m.work_slug,
      title: m.title,
      subtitle: m.subtitle,
      originalKey: m.original_key,
      mode: m.mode,
      tradition: m.tradition,
    }))
}

export default function LovsangPage() {
  const [setlists, setSetlists] = useState<Setlist[]>([])
  const [works, setWorks] = useState<WorkOption[]>(() => toWorkOptions(FALLBACK_META))
  const [editingId, setEditingId] = useState<string | null>(null)
  // En ny, ennå ikke lagret liste holdes her til den lagres første gang.
  const [draft, setDraft] = useState<Setlist | null>(null)

  useEffect(() => {
    installAudioUnlock()
    setSetlists(loadSetlists())
    let alive = true
    fetchSongs().then((rows) => {
      if (alive) setWorks(toWorkOptions(rows))
    })
    return () => {
      alive = false
    }
  }, [])

  const editing = useMemo(
    () => draft ?? setlists.find((s) => s.id === editingId) ?? null,
    [draft, setlists, editingId],
  )

  const newList = () => {
    const sl = createSetlist('', [])
    setDraft(sl)
    setEditingId(sl.id)
  }

  const onSave = (sl: Setlist) => {
    const next = saveSetlist(sl)
    setSetlists(next)
    setDraft(null) // nå persistert — les fra setlists framover
    setEditingId(sl.id)
  }

  const onDelete = () => {
    if (editingId && !draft) setSetlists(deleteSetlist(editingId))
    setDraft(null)
    setEditingId(null)
  }

  const backToList = () => {
    setDraft(null)
    setEditingId(null)
  }

  return (
    <AppShell>
      <main
        className="mx-auto max-w-3xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-lovsang)' }}
      >
        <header className="mb-7">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: 'var(--fag)',
              }}
            >
              <Mic className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Lovsang
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Lovsang</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Bygg søndagens setliste med toneartsflyt og overganger — gi koret tonen og øv
            innledningene. Lydgir starter ved første klikk.
          </p>
        </header>

        {editing ? (
          <SetlistBuilder
            key={editing.id}
            works={works}
            initial={editing}
            onSave={onSave}
            onDelete={onDelete}
            onBack={backToList}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={newList}
              className="inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--fag)' }}
            >
              <Plus className="h-4 w-4" /> Ny setliste
            </button>

            {setlists.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-16 text-center">
                <span
                  aria-hidden
                  className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                    color: 'var(--fag)',
                  }}
                >
                  <ListMusic className="h-6 w-6" />
                </span>
                <p className="font-display text-xl text-[var(--color-ivory)]">Ingen setlister ennå</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">
                  Lag din første setliste, legg til verk fra biblioteket og se hvordan tonearten
                  flyter fra sang til sang.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {setlists.map((sl) => {
                  const { totalRating } = analyzeSetlist(sl.entries)
                  return (
                    <li key={sl.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setDraft(null)
                          setEditingId(sl.id)
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left transition-colors hover:border-[color-mix(in_srgb,var(--fag)_50%,transparent)]"
                      >
                        <div className="min-w-0">
                          <h2 className="truncate font-display text-xl text-[var(--color-ivory)]">
                            {sl.name || 'Uten navn'}
                          </h2>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
                            <span>
                              {sl.entries.length} {sl.entries.length === 1 ? 'innslag' : 'innslag'}
                            </span>
                            {sl.entries.length >= 2 && (
                              <>
                                <span aria-hidden className="h-3 w-px bg-[var(--color-border)]" />
                                <span style={{ color: RATING_COLOR[totalRating] }}>
                                  {RATING_LABEL[totalRating]}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </main>
    </AppShell>
  )
}
