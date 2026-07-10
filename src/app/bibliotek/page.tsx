'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Music4 } from 'lucide-react'
import type { SongMeta, Tradition, Difficulty } from '@/types/song'
import { FALLBACK_META, fetchSongs } from '@/lib/songs'
import { getProgress, type Progress } from '@/lib/progress'
import { NOTE_NAMES } from '@/lib/music'
import { AppShell } from '@/components/AppShell'
import { cn } from '@/lib/cn'

type TradFilter = Tradition | 'all'
type DiffFilter = Difficulty | 'all'

// Ordered label maps — the library filter chips and card badges read from these.
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
function keyLabel(song: SongMeta): string {
  return NOTE_NAMES[song.original_key] + (song.mode === 'minor' ? 'm' : '')
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

export default function BibliotekPage() {
  const [songs, setSongs] = useState<SongMeta[]>(FALLBACK_META)
  const [trad, setTrad] = useState<TradFilter>('all')
  const [diff, setDiff] = useState<DiffFilter>('all')
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS)

  useEffect(() => {
    let alive = true
    fetchSongs().then((rows) => {
      if (alive) setSongs(rows)
    })
    setProgress(getProgress())
    return () => {
      alive = false
    }
  }, [])

  // Only offer chips for traditions actually present in the library.
  const traditions = useMemo(() => {
    const present = new Set(songs.map((s) => s.tradition))
    return TRADITION_ORDER.filter((t) => present.has(t))
  }, [songs])

  const filtered = useMemo(
    () =>
      songs.filter(
        (s) => (trad === 'all' || s.tradition === trad) && (diff === 'all' || s.difficulty === diff),
      ),
    [songs, trad, diff],
  )

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-7">
          <h1 className="font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Bibliotek</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Bla i repertoaret av salmer, hymner, spirituals og gospel. Velg en sang for å øve med
            fallende noter.
          </p>
        </header>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3">
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

        {/* Grid / empty state */}
        {songs.length === 0 ? (
          <EmptyState
            title="Innhold på vei"
            body="Biblioteket fylles snart med salmer, hymner, spirituals og gospel."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Ingen treff"
            body="Ingen sanger matcher filtrene. Prøv å nullstille tradisjon eller nivå."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((song) => (
              <SongCard
                key={song.slug}
                song={song}
                practiced={progress.practiced.includes(song.slug)}
                bestBpm={progress.bestBpm[song.slug]}
              />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  )
}

function SongCard({
  song,
  practiced,
  bestBpm,
}: {
  song: SongMeta
  practiced: boolean
  bestBpm?: number
}) {
  return (
    <Link
      href={`/sang/${song.slug}`}
      className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-amber)]/50"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full bg-[var(--color-raised)] px-2.5 py-1 text-xs font-medium text-[var(--color-muted)]">
          {TRADITION_LABEL[song.tradition]}
        </span>
        {practiced && (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-sea)]"
            title={bestBpm ? `Øvd — beste ${bestBpm} BPM` : 'Øvd'}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Øvd
          </span>
        )}
      </div>

      <h2 className="font-display text-xl leading-snug text-[var(--color-ivory)] group-hover:text-[var(--color-amber)]">
        {song.title}
      </h2>
      {song.subtitle && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">{song.subtitle}</p>
      )}

      <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-[var(--color-muted)]">
        <DifficultyDots level={song.difficulty} />
        <span aria-hidden className="h-3 w-px bg-[var(--color-border)]" />
        <span className="inline-flex items-center gap-1">
          <Music4 className="h-3.5 w-3.5" />
          {keyLabel(song)}
        </span>
        <span aria-hidden className="h-3 w-px bg-[var(--color-border)]" />
        <span>{song.default_bpm} BPM</span>
      </div>
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
