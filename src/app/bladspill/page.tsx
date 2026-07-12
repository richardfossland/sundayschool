'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Timer } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ReadingSession, progressKeyFor } from '@/components/bladspill/ReadingSession'
import { SUBJECT_BY_ID } from '@/lib/subjects'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { getProgress } from '@/lib/progress'
import { type Level } from '@/lib/bladspill/exercises'
import { cn } from '@/lib/cn'

// ── Bladspill — fag-forside + leselab ─────────────────────────────────────────
// Sight-reading practice. The learner picks a level (1–3) and a mode
// (vent-modus for beginners, fri lesing for speed), then reads generated scores
// on the shared NotationSong + keyboard/MIDI pipeline. Best reading speed per
// level (noter/min) is stored in progress under `bladspill:nivaa-{level}` — the
// same "best value" field the other subjects use (see lib/progress).

const { icon: Icon, label, accent } = SUBJECT_BY_ID.bladspill

const LEVELS: { level: Level; title: string; desc: string }[] = [
  {
    level: 1,
    title: 'Nivå 1',
    desc: 'C-dur, høyre hånd, trinnvis. Hel-, halv- og fjerdedeler i 4/4.',
  },
  {
    level: 2,
    title: 'Nivå 2',
    desc: 'C-, F- og G-dur. Sprang opp til kvint, åttedeler og av og til opptakt.',
  },
  {
    level: 3,
    title: 'Nivå 3',
    desc: 'Eb-, D- og A-dur med fortegn. Venstre hånd i tillegg, og 3/4 og 6/8.',
  },
]

const MODES: { id: 'vent' | 'fri'; title: string; desc: string; icon: typeof Eye }[] = [
  {
    id: 'vent',
    title: 'Vent-modus',
    desc: 'For nybegynnere. Notene venter på deg — spill én tone om gangen.',
    icon: Eye,
  },
  {
    id: 'fri',
    title: 'Fri lesing',
    desc: 'Les gjennom mot klokka. Mål: flest riktige noter i minuttet.',
    icon: Timer,
  },
]

export default function BladspillPage() {
  const [best, setBest] = useState<Record<string, number>>({})
  const [level, setLevel] = useState<Level | null>(null)
  const [mode, setMode] = useState<'vent' | 'fri' | null>(null)

  useEffect(() => {
    installAudioUnlock()
    setBest(getProgress().bestBpm)
  }, [])

  const started = level !== null && mode !== null

  const reset = () => {
    setLevel(null)
    setMode(null)
    setBest(getProgress().bestBpm)
  }

  return (
    <AppShell>
      <main
        className="mx-auto max-w-3xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: accent }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Skolen
        </Link>

        <header className="mt-3 mb-7">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                color: accent,
              }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · {label}
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">
            {label}
          </h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Tren notelesing på genererte oppgaver. Velg nivå og modus — lyden starter ved
            første tastetrykk.
          </p>
        </header>

        {/* Menu: pick level + mode */}
        {!started && (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                Nivå
              </h2>
              <div className="grid gap-3">
                {LEVELS.map((l) => {
                  const b = best[progressKeyFor(l.level)]
                  return (
                    <button
                      key={l.level}
                      type="button"
                      onClick={() => setLevel(l.level)}
                      className={cn(
                        'rounded-2xl border px-5 py-4 text-left transition-colors',
                        level === l.level
                          ? 'border-[var(--fag)] bg-[color-mix(in_srgb,var(--fag)_10%,transparent)]'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-raised)]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display text-lg text-[var(--color-ivory)]">
                          {l.title}
                        </h3>
                        {b !== undefined && (
                          <span className="text-xs text-[var(--color-muted)]">
                            beste {b} noter/min
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{l.desc}</p>
                    </button>
                  )
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                Modus
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {MODES.map(({ id, title, desc, icon: MIcon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={cn(
                      'rounded-2xl border p-5 text-left transition-colors',
                      mode === id
                        ? 'border-[var(--fag)] bg-[color-mix(in_srgb,var(--fag)_10%,transparent)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-raised)]',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className="grid h-8 w-8 place-items-center rounded-lg"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                          color: accent,
                        }}
                      >
                        <MIcon className="h-5 w-5" />
                      </span>
                      <h3 className="font-display text-lg text-[var(--color-ivory)]">{title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{desc}</p>
                  </button>
                ))}
              </div>
            </section>

            <p className="text-sm text-[var(--color-muted)]">
              {level === null
                ? 'Velg et nivå for å begynne.'
                : mode === null
                  ? 'Velg en modus for å begynne.'
                  : ''}
            </p>
          </div>
        )}

        {/* Running session */}
        {started && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[var(--color-muted)]">
                {LEVELS.find((l) => l.level === level)?.title} ·{' '}
                {MODES.find((m) => m.id === mode)?.title}
              </p>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-[var(--color-muted)] underline-offset-2 transition-colors hover:text-[var(--color-ivory)] hover:underline"
              >
                Velg på nytt
              </button>
            </div>
            <ReadingSession
              // Remount when level or mode changes so no state leaks.
              key={`${level}-${mode}`}
              level={level}
              mode={mode}
              onScore={(v) => setBest((prev) => ({ ...prev, [progressKeyFor(level)]: v }))}
            />
          </div>
        )}
      </main>
    </AppShell>
  )
}
