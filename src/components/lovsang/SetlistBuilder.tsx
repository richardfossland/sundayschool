'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Search,
  Save,
  Waypoints,
  X,
} from 'lucide-react'
import type { Mode, Song, Tradition } from '@/types/song'
import { KEY_NAMES } from '@/lib/music'
import { cn } from '@/lib/cn'
import { fetchSong } from '@/lib/songs'
import {
  addEntry,
  analyzeSetlist,
  createSetlist,
  entryMode,
  moveEntry,
  removeEntryAt,
  setEntryKey,
  type FlowRating,
  type Setlist,
  type SetlistEntry,
} from '@/lib/lovsang/setlist'
import { GiTonen } from './GiTonen'
import { IntroTrening } from './IntroTrening'

// ── SetlistBuilder ────────────────────────────────────────────────────────────
// Redigerer én setliste: velg verk fra biblioteket (gruppert på work_slug),
// sett måltoneart per innslag (12-grid), omorganiser og slett. Mellom innslagene
// vises en flyt-indikator (kvintsirkel-avstand) med ekspanderbare overgangsråd.
// «Kjør gjennom intro» går sekvensielt gjennom lista og øver hver innledning.

/** Ett verk i biblioteket (nivå-1-varianten der slug === work_slug). */
export interface WorkOption {
  workSlug: string
  title: string
  subtitle: string | null
  originalKey: number
  mode: Mode
  tradition: Tradition
}

const RATING_STYLE: Record<FlowRating, { label: string; color: string }> = {
  god: { label: 'God flyt', color: '#6BD08A' },
  ok: { label: 'Grei flyt', color: 'var(--color-amber)' },
  krevende: { label: 'Krevende overgang', color: 'var(--color-danger)' },
}

function keyLabel(targetKey: number, mode: Mode): string {
  return KEY_NAMES[targetKey] + (mode === 'minor' ? 'm' : '')
}

interface Props {
  works: WorkOption[]
  initial: Setlist
  onSave: (setlist: Setlist) => void
  onDelete: () => void
  onBack: () => void
}

export function SetlistBuilder({ works, initial, onSave, onDelete, onBack }: Props) {
  const [name, setName] = useState(initial.name)
  const [entries, setEntries] = useState<SetlistEntry[]>(initial.entries)
  const [query, setQuery] = useState('')
  const [openTransition, setOpenTransition] = useState<number | null>(null)
  const [walk, setWalk] = useState<number | null>(null)

  const workBySlug = useMemo(() => new Map(works.map((w) => [w.workSlug, w])), [works])
  const analysis = useMemo(() => analyzeSetlist(entries), [entries])

  // Lister lagret før innslagene bar modus leses som dur. Så snart biblioteket
  // er lastet fyller vi inn verkets ekte modus, ellers ville en gammel mollsang
  // bli flyt-analysert som dur for alltid (parallelltonearter feilmeldt som
  // «krevende overgang»). Skrives til lageret ved neste «Lagre».
  useEffect(() => {
    setEntries((es) => {
      let changed = false
      const next = es.map((e) => {
        if (e.mode) return e
        const w = workBySlug.get(e.workSlug)
        if (!w) return e
        changed = true
        return { ...e, mode: w.mode }
      })
      return changed ? next : es
    })
  }, [workBySlug])

  // ── Sangene bak innslagene ─────────────────────────────────────────────────
  // Hentes ÉN gang her og sendes ned som prop. Både «gi tonen» og intro-øvingen
  // trenger hele sangen (med den tunge doc-kolonnen); henter de hver for seg
  // ender en liste på fire innslag med åtte parallelle nedlastinger av samme
  // data. fetchSong dedupliserer i tillegg per slug for hele økta.
  const [songs, setSongs] = useState<Record<string, Song | null>>({})
  const neededSlugs = useMemo(
    () => [...new Set(entries.map((e) => e.workSlug))].sort().join('|'),
    [entries],
  )
  useEffect(() => {
    if (!neededSlugs) return
    let alive = true
    for (const slug of neededSlugs.split('|')) {
      void fetchSong(slug).then((s) => {
        if (alive) setSongs((prev) => (slug in prev && prev[slug] === s ? prev : { ...prev, [slug]: s }))
      })
    }
    return () => {
      alive = false
    }
  }, [neededSlugs])
  const transitionByFrom = useMemo(
    () => new Map(analysis.perTransition.map((t) => [t.fromIndex, t])),
    [analysis],
  )

  const filteredWorks = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return works
    return works.filter(
      (w) =>
        w.title.toLowerCase().includes(q) || (w.subtitle?.toLowerCase().includes(q) ?? false),
    )
  }, [works, query])

  const save = () => {
    onSave(createSetlist(name.trim() || 'Uten navn', entries, initial.id, Date.now()))
  }

  const add = (w: WorkOption) => {
    // Modusen følger med verket: uten den leses en mollsang som dur, og
    // flyt-analysen dømmer parallelltonearter som «krevende overgang».
    setEntries((e) =>
      addEntry(e, { workSlug: w.workSlug, targetKey: w.originalKey, mode: w.mode }),
    )
    setQuery('')
  }

  // ── Intro-gjennomgang (sekvensiell øving av innledningene) ──────────────────
  if (walk !== null && entries[walk]) {
    const entry = entries[walk]
    const w = workBySlug.get(entry.workSlug)
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
            Intro-gjennomgang · {walk + 1} / {entries.length}
          </p>
          <button
            type="button"
            onClick={() => setWalk(null)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
          >
            <X className="h-4 w-4" /> Avslutt
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="font-display text-2xl text-[var(--color-ivory)]">{w?.title ?? entry.workSlug}</h2>
          {w?.subtitle && <p className="mt-1 text-sm text-[var(--color-muted)]">{w.subtitle}</p>}
          <p className="mt-1 text-sm text-[var(--fag)]">
            {keyLabel(entry.targetKey, entryMode(entry))}
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <GiTonen song={songs[entry.workSlug] ?? null} targetKey={entry.targetKey} />
            <IntroTrening
              song={songs[entry.workSlug] ?? null}
              workSlug={entry.workSlug}
              targetKey={entry.targetKey}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setWalk((i) => (i !== null && i > 0 ? i - 1 : i))}
            disabled={walk === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)] disabled:opacity-40"
          >
            <ChevronUp className="h-4 w-4 rotate-[-90deg]" /> Forrige
          </button>
          <button
            type="button"
            onClick={() =>
              setWalk((i) => (i !== null && i < entries.length - 1 ? i + 1 : i))
            }
            disabled={walk >= entries.length - 1}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: 'var(--fag)' }}
          >
            Neste <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Topp: tilbake + navn + lagre */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" /> Mine setlister
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-danger)]"
          >
            <Trash2 className="h-4 w-4" /> Slett
          </button>
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--fag)' }}
          >
            <Save className="h-4 w-4" /> Lagre
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="setlist-name" className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          Setliste
        </label>
        <input
          id="setlist-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Søndagens setliste"
          className="mt-1.5 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 font-display text-xl text-[var(--color-ivory)] outline-none focus:border-[var(--fag)]"
        />
      </div>

      {/* Samlet flyt + intro-gjennomgang */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
          {entries.length} {entries.length === 1 ? 'innslag' : 'innslag'}
          {entries.length >= 2 && (
            <>
              <span aria-hidden className="h-3 w-px bg-[var(--color-border)]" />
              <span style={{ color: RATING_STYLE[analysis.totalRating].color }}>
                {RATING_STYLE[analysis.totalRating].label}
              </span>
            </>
          )}
        </span>
        {entries.length >= 1 && (
          <button
            type="button"
            onClick={() => setWalk(0)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
          >
            <Waypoints className="h-4 w-4" /> Kjør gjennom intro
          </button>
        )}
      </div>

      {/* Innslag */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
          <p className="text-[var(--color-ivory)]">Tom setliste</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-muted)]">
            Legg til verk fra biblioteket nedenfor for å begynne å bygge flyten.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {entries.map((entry, i) => {
            const w = workBySlug.get(entry.workSlug)
            const trans = transitionByFrom.get(i)
            return (
              // Nøkkelen er innslagets EGEN id, ikke posisjonen: med en
              // indeksnøkkel remonterer React alt fra og med et flyttet innslag,
              // og en intro som spiller rives ned midt i.
              <li key={entry.id ?? `${entry.workSlug}-${i}`} className="flex flex-col gap-3">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--fag) 16%, transparent)',
                          color: 'var(--fag)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="font-display text-lg leading-snug text-[var(--color-ivory)]">
                          {w?.title ?? entry.workSlug}
                        </h3>
                        {w?.subtitle && (
                          <p className="text-sm text-[var(--color-muted)]">{w.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton
                        label="Flytt opp"
                        onClick={() => setEntries((e) => moveEntry(e, i, -1))}
                        disabled={i === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Flytt ned"
                        onClick={() => setEntries((e) => moveEntry(e, i, 1))}
                        disabled={i === entries.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label="Fjern innslag"
                        onClick={() => setEntries((e) => removeEntryAt(e, i))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </div>

                  {/* Toneart-grid */}
                  <div className="mt-4 flex items-start gap-2">
                    <span className="mt-1.5 w-16 shrink-0 text-sm text-[var(--color-muted)]">
                      Toneart
                    </span>
                    <div className="grid flex-1 grid-cols-6 gap-1.5 sm:grid-cols-12">
                      {KEY_NAMES.map((n, k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setEntries((e) => setEntryKey(e, i, k))}
                          aria-pressed={entry.targetKey === k}
                          className={cn(
                            'rounded-lg border py-1.5 text-sm font-medium tabular-nums transition-colors',
                            entry.targetKey === k
                              ? 'text-[var(--color-scene)]'
                              : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-ivory)]',
                          )}
                          style={
                            entry.targetKey === k
                              ? { backgroundColor: 'var(--fag)', borderColor: 'var(--fag)' }
                              : undefined
                          }
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <GiTonen song={songs[entry.workSlug] ?? null} targetKey={entry.targetKey} />
                    <IntroTrening
                      song={songs[entry.workSlug] ?? null}
                      workSlug={entry.workSlug}
                      targetKey={entry.targetKey}
                    />
                  </div>
                </div>

                {/* Flyt-indikator mellom dette og neste innslag */}
                {trans && (
                  <div className="ml-3 flex flex-col">
                    <button
                      type="button"
                      onClick={() => setOpenTransition((o) => (o === i ? null : i))}
                      aria-expanded={openTransition === i}
                      className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-scene)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-raised)]"
                    >
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: RATING_STYLE[trans.rating].color }}
                      />
                      <span style={{ color: RATING_STYLE[trans.rating].color }}>
                        {RATING_STYLE[trans.rating].label}
                      </span>
                      <span className="text-[var(--color-muted)]">
                        · {trans.steps} kvint{trans.steps === 1 ? '' : 'er'} unna
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 text-[var(--color-muted)] transition-transform',
                          openTransition === i && 'rotate-180',
                        )}
                      />
                    </button>
                    {openTransition === i && (
                      <ul className="animate-fade-in mt-2 flex flex-col gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-muted)]">
                        {trans.suggestions.map((s, si) => (
                          <li key={si} className="flex gap-2">
                            <span aria-hidden style={{ color: 'var(--fag)' }}>
                              ›
                            </span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {/* Verkvelger */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          Legg til verk
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] px-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk i biblioteket …"
            className="w-full bg-transparent py-2.5 text-sm text-[var(--color-ivory)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>
        <div className="mt-3 flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          {filteredWorks.length === 0 ? (
            <p className="px-1 py-4 text-sm text-[var(--color-muted)]">Ingen verk matcher søket.</p>
          ) : (
            filteredWorks.map((w) => (
              <button
                key={w.workSlug}
                type="button"
                onClick={() => add(w)}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-left transition-colors hover:border-[color-mix(in_srgb,var(--fag)_50%,transparent)] hover:bg-[var(--color-raised)]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--color-ivory)]">
                    {w.title}
                  </span>
                  <span className="block truncate text-xs text-[var(--color-muted)]">
                    {keyLabel(w.originalKey, w.mode)}
                    {w.subtitle ? ` · ${w.subtitle}` : ''}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--fag) 16%, transparent)',
                    color: 'var(--fag)',
                  }}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)] disabled:opacity-30"
    >
      {children}
    </button>
  )
}
