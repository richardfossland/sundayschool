'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Music4, Search } from 'lucide-react'
import type { SongMeta, Tradition, Difficulty } from '@/types/song'
import { fetchSongs } from '@/lib/songs'
import { getProgress, type Progress } from '@/lib/progress'
import { NOTE_NAMES } from '@/lib/music'
import {
  groupWorks,
  filterWorks,
  availableCategories,
  type WorkGroup,
  type WorkVariant,
} from '@/lib/library-grouping'
import { cn } from '@/lib/cn'

// ── SongLibraryList ───────────────────────────────────────────────────────────
// The reusable song browser lifted out of the old /bibliotek page so every
// instrument fag can share it. `hrefBase` is the route each card links to
// (piano → '/piano/sang'); the subject prefix used for progress badges is
// derived from it (first path segment), matching the `{fag}:{slug}` keys written
// by lib/progress.
//
// v3 redesign for the larger song bank: arrangements are GROUPED into works
// (one card per work_slug) with a level picker (Enkel/Firstemmig/Gospel) on the
// card; plus free-text search and curated category chips. All grouping/filtering
// lives in the pure, unit-tested lib/library-grouping — this file is the view.

type TradFilter = Tradition | 'all'
type DiffFilter = Difficulty | 'all'

const TRADITION_LABEL: Record<Tradition, string> = {
  salme: 'Salmer',
  hymne: 'Hymner',
  spiritual: 'Spirituals',
  gospel: 'Gospel',
  lovsang: 'Lovsang',
}
const TRADITION_ORDER: Tradition[] = ['salme', 'hymne', 'spiritual', 'gospel', 'lovsang']

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: 'Enkel',
  2: 'Middels',
  3: 'Full sats',
}

const EMPTY_PROGRESS: Progress = {
  practiced: [],
  bestBpm: {},
  lastPracticed: {},
  sectionPracticed: [],
  sectionBestBpm: {},
}

/** Key label from the denormalised original_key (0–11) + mode. */
function keyLabel(g: WorkGroup): string {
  return NOTE_NAMES[g.original_key] + (g.mode === 'minor' ? 'm' : '')
}

/** Difficulty as ●●○ (filled = level, of 3). */
function DifficultyDots({ level }: { level: Difficulty }) {
  return (
    <span aria-label={`Vanskelighet ${level} av 3`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            i <= level ? 'bg-[var(--color-amber)]' : 'bg-[var(--color-border)]',
          )}
        />
      ))}
    </span>
  )
}

export function SongLibraryList({ hrefBase }: { hrefBase: string }) {
  // Empty until fetchSongs answers. Seeding this from the bundled seed library
  // meant every visitor downloaded ~79 kB gz of note data to see a list of
  // titles — the seeds are now a fallback path inside lib/songs, not a bundle.
  const [songs, setSongs] = useState<SongMeta[]>([])
  const [loaded, setLoaded] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [trad, setTrad] = useState<TradFilter>('all')
  const [diff, setDiff] = useState<DiffFilter>('all')
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS)

  // Subject prefix for progress keys, e.g. '/piano/sang' → 'piano'.
  const subject = useMemo(() => hrefBase.replace(/^\/+/, '').split('/')[0] || 'piano', [hrefBase])

  useEffect(() => {
    let alive = true
    fetchSongs().then((rows) => {
      if (!alive) return
      setSongs(rows)
      setLoaded(true)
    })
    setProgress(getProgress())
    return () => {
      alive = false
    }
  }, [])

  // Debounce the search box (~200ms) so filtering doesn't run on every keypress.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(id)
  }, [query])

  const groups = useMemo(() => groupWorks(songs), [songs])

  const traditions = useMemo(() => {
    const present = new Set(groups.map((g) => g.tradition))
    return TRADITION_ORDER.filter((t) => present.has(t))
  }, [groups])

  const categories = useMemo(() => availableCategories(groups), [groups])

  const filtered = useMemo(
    () => filterWorks(groups, { query: debouncedQuery, category, tradition: trad, difficulty: diff }),
    [groups, debouncedQuery, category, trad, diff],
  )

  // The subject-prefixed progress key for a variant slug.
  const isPracticed = (slug: string) => progress.practiced.includes(`${subject}:${slug}`)

  return (
    <>
      {/* Search */}
      <div className="relative mb-4">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk etter sang, tittel eller stikkord …"
          aria-label="Søk i biblioteket"
          className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-ivory)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-amber)]/60 focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-3">
        {categories.length > 0 && (
          <FilterRow label="Kategori">
            <Chip active={category === null} onClick={() => setCategory(null)}>
              Alle
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(category === c.id ? null : c.id)}
              >
                {c.label}
              </Chip>
            ))}
          </FilterRow>
        )}
        <FilterRow label="Tradisjon">
          <Chip active={trad === 'all'} onClick={() => setTrad('all')}>
            Alle
          </Chip>
          {traditions.map((t) => (
            <Chip key={t} active={trad === t} onClick={() => setTrad(t)}>
              {TRADITION_LABEL[t]}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Nivå">
          <Chip active={diff === 'all'} onClick={() => setDiff('all')}>
            Alle
          </Chip>
          {([1, 2, 3] as Difficulty[]).map((d) => (
            <Chip key={d} active={diff === d} onClick={() => setDiff(d)}>
              {DIFFICULTY_LABEL[d]}
            </Chip>
          ))}
        </FilterRow>
      </div>

      {/* Result count */}
      {songs.length > 0 && (
        <p className="mb-4 text-sm text-[var(--color-muted)]" aria-live="polite">
          {filtered.length === groups.length
            ? `${groups.length} verk`
            : `${filtered.length} av ${groups.length} verk`}
        </p>
      )}

      {/* Grid / empty state. "Innhold på vei" is only honest once the fetch has
          ANSWERED — before that the list is merely not loaded yet. */}
      {!loaded ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Laster biblioteket"
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              aria-hidden
              className="h-40 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <EmptyState
          title="Innhold på vei"
          body="Biblioteket fylles snart med salmer, hymner, spirituals og gospel."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Ingen treff"
          body="Ingen sanger matcher søket eller filtrene. Prøv å nullstille dem."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <WorkCard
              key={g.work_slug}
              group={g}
              hrefBase={hrefBase}
              activeDifficulty={diff === 'all' ? null : diff}
              isPracticed={isPracticed}
            />
          ))}
        </div>
      )}
    </>
  )
}

function WorkCard({
  group,
  hrefBase,
  activeDifficulty,
  isPracticed,
}: {
  group: WorkGroup
  hrefBase: string
  activeDifficulty: Difficulty | null
  isPracticed: (slug: string) => boolean
}) {
  const single = group.variants.length === 1
  const workPracticed = group.variants.some((v) => isPracticed(v.slug))

  const header = (
    <>
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full bg-[var(--color-raised)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
          {TRADITION_LABEL[group.tradition]}
        </span>
        {workPracticed && (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-sea)]"
            title="Øvd"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Øvd
          </span>
        )}
      </div>

      <h2 className="font-display text-xl leading-snug text-[var(--color-ivory)] group-hover:text-[var(--color-amber)]">
        {group.title}
      </h2>
      {group.subtitle && <p className="mt-1 text-sm text-[var(--color-muted)]">{group.subtitle}</p>}
    </>
  )

  const meta = (
    <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
      <span className="inline-flex items-center gap-1">
        <Music4 className="h-3.5 w-3.5" />
        {keyLabel(group)}
      </span>
      <span aria-hidden className="h-3 w-px bg-[var(--color-border)]" />
      {/* Tempo differs between levels on some works (84 enkel / 76 firstemmig),
          so show the span rather than passing off one level's number as the
          work's — see WorkGroup.bpmRange. */}
      <span>
        {group.bpmRange ? `${group.bpmRange[0]}–${group.bpmRange[1]}` : group.default_bpm} BPM
      </span>
    </div>
  )

  // Single arrangement: the whole card is the link (as before).
  if (single) {
    const v = group.variants[0]
    return (
      <Link
        href={`${hrefBase}/${v.slug}`}
        className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-amber)]/50"
      >
        {header}
        <div className="mt-auto flex items-center gap-3 pt-4">
          <DifficultyDots level={v.difficulty} />
          <span aria-hidden className="h-3 w-px bg-[var(--color-border)]" />
          {meta}
        </div>
      </Link>
    )
  }

  // Several arrangements: a non-link card with a variant/level picker.
  return (
    <div className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-amber)]/50">
      {header}
      <div className="mt-3 flex flex-wrap gap-2">
        {group.variants.map((v) => (
          <VariantChip
            key={v.slug}
            variant={v}
            hrefBase={hrefBase}
            highlighted={activeDifficulty === v.difficulty}
            practiced={isPracticed(v.slug)}
          />
        ))}
      </div>
      <div className="mt-4 pt-3">{meta}</div>
    </div>
  )
}

function VariantChip({
  variant,
  hrefBase,
  highlighted,
  practiced,
}: {
  variant: WorkVariant
  hrefBase: string
  highlighted: boolean
  practiced: boolean
}) {
  return (
    <Link
      href={`${hrefBase}/${variant.slug}`}
      aria-label={`${variant.variant_label ?? 'Spill'}${practiced ? ' — øvd' : ''}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        highlighted
          ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15 text-[var(--color-ivory)]'
          : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-muted)] hover:border-[var(--color-amber)]/50 hover:text-[var(--color-ivory)]',
      )}
    >
      {practiced && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-sea)]"
          title="Øvd"
        />
      )}
      {variant.variant_label}
    </Link>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-20 text-center">
      <p className="font-display text-xl text-[var(--color-ivory)]">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">{body}</p>
    </div>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-sm text-[var(--color-muted)]">{label}</span>
      {children}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-[var(--color-amber)] bg-[var(--color-amber)] text-[var(--color-ink-on-amber)]'
          : 'border-[var(--color-border)] bg-[var(--color-raised)] text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
      )}
    >
      {children}
    </button>
  )
}
