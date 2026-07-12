'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, AudioLines, Hand, ListMusic, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { TapSession } from '@/components/rytme/TapSession'
import { DiktatSession } from '@/components/rytme/DiktatSession'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { createRng, generateRhythm, type Level, type RhythmExercise } from '@/lib/rytme/exercises'
import { getProgress, recordPractice } from '@/lib/progress'
import { cn } from '@/lib/cn'

// ── Rytme — fag-forside + trener ─────────────────────────────────────────────
// Two modes over three levels:
//   • Tapp — read a generated rhythm as notes and tap it back; timing judged by
//     the shared drum trainer (best = hit percentage).
//   • Diktat — hear a rhythm and pick which of three notated rhythms it was
//     (sessions of 8; best = correct × 12.5, i.e. a 0–100 score).
// Rhythms come from the pure, seeded generators in lib/rytme/exercises. Best
// scores are stored in progress.ts under rytme:tapp-{level} / rytme:diktat-{level}
// (bestBpm field, higher-is-better — same reuse as gehør's score storage).

type Tab = 'tapp' | 'diktat'

const LEVEL_HINTS: Record<Tab, [string, string, string]> = {
  tapp: ['Fjerdedeler og halvnoter', '+ åttedeler og punkteringer', '+ synkoper, trioler og 16-deler'],
  diktat: ['Fjerdedeler og halvnoter', '+ åttedeler og punkteringer', '+ synkoper, trioler og 16-deler'],
}

const tappKey = (level: Level) => `rytme:tapp-${level}`
const diktatKey = (level: Level) => `rytme:diktat-${level}`

export default function RytmePage() {
  const [tab, setTab] = useState<Tab>('tapp')
  const [level, setLevel] = useState<Level>(1)
  const [best, setBest] = useState<Record<string, number>>({})
  const [tapExercise, setTapExercise] = useState<RhythmExercise | null>(null)
  const [diktatRound, setDiktatRound] = useState(0)
  const [diktatResult, setDiktatResult] = useState<number | null>(null)

  useEffect(() => {
    installAudioUnlock()
    setBest(getProgress().bestBpm)
  }, [])

  // Keep a tap rhythm ready for the current level (client-only — avoids SSR
  // divergence from the Date.now() seed).
  const newTapRhythm = () => setTapExercise(generateRhythm(level, createRng(Date.now())))
  useEffect(() => {
    setTapExercise(generateRhythm(level, createRng(Date.now())))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  const onTapScore = (pct: number) => {
    const p = recordPractice(tappKey(level), pct)
    setBest(p.bestBpm)
  }

  const onDiktatComplete = (correct: number) => {
    const p = recordPractice(diktatKey(level), correct * 12.5)
    setBest(p.bestBpm)
    setDiktatResult(correct)
  }

  const startNewDiktat = () => {
    setDiktatResult(null)
    setDiktatRound((r) => r + 1)
  }

  const changeTab = (t: Tab) => {
    if (t === tab) return
    setTab(t)
    setDiktatResult(null)
  }

  const changeLevel = (l: Level) => {
    setLevel(l)
    setDiktatResult(null)
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12" style={{ ['--fag' as string]: 'var(--fag-rytme)' }}>
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
              style={{ backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)', color: 'var(--fag)' }}
            >
              <AudioLines className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">Fag · Rytme</span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Rytme</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Les rytmen fra notene og tapp den tilbake — eller hør en rytme og kjenn den igjen.
            Lyden starter ved første klikk.
          </p>
        </header>

        {/* Mode tabs */}
        <div className="mb-5 inline-flex rounded-full border border-[var(--color-border)] p-1" role="tablist" aria-label="Modus">
          {([
            { id: 'tapp' as Tab, label: 'Tapp', icon: Hand },
            { id: 'diktat' as Tab, label: 'Diktat', icon: ListMusic },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => changeTab(id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                tab === id
                  ? 'bg-[var(--fag-rytme)] text-[var(--color-scene)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* Level selector */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {([1, 2, 3] as const).map((l) => {
            const b = best[tab === 'tapp' ? tappKey(l) : diktatKey(l)]
            return (
              <button
                key={l}
                type="button"
                onClick={() => changeLevel(l)}
                aria-pressed={l === level}
                className={cn(
                  'rounded-xl border px-4 py-2 text-left transition-colors',
                  l === level
                    ? 'border-[var(--fag-rytme)] bg-[color-mix(in_srgb,var(--fag-rytme)_12%,transparent)]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-raised)]',
                )}
              >
                <span className="block text-sm font-medium text-[var(--color-ivory)]">Nivå {l}</span>
                <span className="block text-xs text-[var(--color-muted)]">
                  {LEVEL_HINTS[tab][l - 1]}
                  {b !== undefined && ` · beste ${Math.round(b)} %`}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tapp */}
        {tab === 'tapp' && tapExercise && (
          <TapSession
            key={`tapp-${level}-${tapExercise.lengthBeats}-${tapExercise.doc.notes.length}-${tapExercise.doc.notes[0]?.t ?? 0}`}
            exercise={tapExercise}
            level={level}
            onScore={onTapScore}
            onNewRhythm={newTapRhythm}
          />
        )}

        {/* Diktat */}
        {tab === 'diktat' &&
          (diktatResult === null ? (
            <DiktatSession
              key={`diktat-${level}-${diktatRound}`}
              level={level}
              onLevelChange={changeLevel}
              onComplete={onDiktatComplete}
            />
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">Diktat · Nivå {level}</p>
              <p className="mt-3 font-display text-4xl text-[var(--color-ivory)]">{diktatResult} av 8</p>
              <p className={cn('mt-2 text-sm', diktatResult >= 6 ? 'text-[#6BD08A]' : 'text-[var(--color-muted)]')}>
                {diktatResult === 8
                  ? 'Perfekt økt!'
                  : diktatResult >= 6
                    ? 'Sterkt — godt rytmisk øre.'
                    : diktatResult >= 4
                      ? 'God trening — én økt til?'
                      : 'Rytmefølelsen bygges én økt om gangen. Prøv igjen!'}
                {best[diktatKey(level)] !== undefined && ` Beste: ${Math.round(best[diktatKey(level)])} %.`}
              </p>
              <button
                type="button"
                onClick={startNewDiktat}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--fag-rytme)] px-5 py-2.5 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" /> Ny økt
              </button>
            </div>
          ))}
      </main>
    </AppShell>
  )
}
