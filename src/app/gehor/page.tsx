'use client'

import { useEffect, useMemo, useState } from 'react'
import { Ear, Music3, Piano, RotateCcw, Waves } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ExerciseCard } from '@/components/gehor/ExerciseCard'
import { AnswerKeyboard, preloadAnswerKeyboard } from '@/components/gehor/AnswerKeyboardLazy'
import { installAudioUnlockSoon } from '@/lib/audio-unlock-lazy'
import {
  chordQualityExercise,
  createRng,
  intervalExercise,
  melodyExercise,
  type ChordQualityExercise,
  type IntervalExercise,
  type Level,
  type MelodyExercise,
} from '@/lib/gehor/exercises'
import { intervalName } from '@/lib/theory/intervals'
import { QUALITY_LABELS } from '@/lib/theory/diatonic'
import { getProgress, recordPractice } from '@/lib/progress'
import { cn } from '@/lib/cn'

// ── Gehør — fag-forside + trener ──────────────────────────────────────────────
// Three exercise types (intervals, chord quality, melodic dictation) × three
// levels, drilled in sessions of 10 tasks. Exercises come from the pure,
// seeded generators in lib/gehor/exercises — the page seeds one RNG per
// session (Date.now(); Math.random stays banned in the testable layer).
//
// Progress: on finishing a session we call
// recordPractice(`gehor:{type}-{level}`, scorePercent). recordPractice's
// second argument is nominally a BPM, but its semantics are just "best value,
// higher is better, raised on new records" — a 0–100 score percentage fits
// those semantics exactly, so gehør keys store best score-% in the bestBpm
// field rather than bolting a parallel store onto progress.ts.

const SESSION_LENGTH = 10

type ExerciseType = 'intervall' | 'akkord' | 'melodi'

const TYPES: { id: ExerciseType; label: string; description: string; icon: typeof Ear }[] = [
  {
    id: 'intervall',
    label: 'Intervaller',
    description: 'Hør to toner og kjenn igjen avstanden — fra sekund til over oktaven.',
    icon: Waves,
  },
  {
    id: 'akkord',
    label: 'Akkordkvalitet',
    description: 'Dur eller moll? Maj7 eller m7? Kjenn igjen akkordens farge.',
    icon: Music3,
  },
  {
    id: 'melodi',
    label: 'Melodidiktat',
    description: 'Hør en kort melodi og spill den tilbake på klaviaturet.',
    icon: Piano,
  },
]

const LEVEL_HINTS: Record<ExerciseType, [string, string, string]> = {
  intervall: ['Stigende, innen oktaven', '+ fallende', '+ over oktaven'],
  akkord: ['Dur og moll', '+ 7, maj7 og m7', '+ dim, sus4 og add9'],
  melodi: ['3 toner, trinnvis i C-dur', '5 toner med sprang', '7 toner, ny toneart'],
}

// A running session: exercises are pre-generated (deterministic per seed).
interface Session {
  type: ExerciseType
  level: Level
  exercises: (IntervalExercise | ChordQualityExercise | MelodyExercise)[]
  index: number
  correct: number
  /** Melody mode: message shown after the melody is completed (null = unanswered). */
  melodyMessage: string | null
}

function buildSession(type: ExerciseType, level: Level, seed: number): Session {
  const rng = createRng(seed)
  const gen =
    type === 'intervall' ? intervalExercise : type === 'akkord' ? chordQualityExercise : melodyExercise
  return {
    type,
    level,
    exercises: Array.from({ length: SESSION_LENGTH }, () => gen(level, rng)),
    index: 0,
    correct: 0,
    melodyMessage: null,
  }
}

const progressKey = (type: ExerciseType, level: Level) => `gehor:${type}-${level}`

export default function GehorPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [result, setResult] = useState<{ type: ExerciseType; level: Level; correct: number } | null>(null)
  // Read localStorage only after mount (SSR-safe), refreshed when a session ends.
  const [best, setBest] = useState<Record<string, number>>({})

  useEffect(() => {
    installAudioUnlockSoon()
    setBest(getProgress().bestBpm)
  }, [])

  const start = (type: ExerciseType, level: Level) => {
    // Warm what the running session will reach for. The menu itself is buttons
    // and text, so neither the engine (and Tone behind it) nor the answer
    // keyboard belongs in this route's first load — but by the time the learner
    // has read the first task and pressed «Spill», both are here.
    void import('@/lib/engine')
    if (type === 'melodi') preloadAnswerKeyboard()
    setResult(null)
    setSession(buildSession(type, level, Date.now()))
  }

  const current = session?.exercises[session.index]

  // (Re)play the current task's audio. The engine is imported here rather than
  // at the top of the file: it carries Tone, and this page's menu — the three
  // exercise cards with their level buttons — must paint without it. start()
  // has already warmed the chunk, so this await is normally already settled.
  const play = useMemo(() => {
    if (!session || !current) return () => {}
    return async () => {
      const { getEngine } = await import('@/lib/engine')
      const engine = getEngine()
      if (session.type === 'intervall') {
        const ex = current as IntervalExercise
        void engine.playNote(ex.notes[0], 0.85, 0.8)
        window.setTimeout(() => void engine.playNote(ex.notes[1], 0.85, 1.0), 700)
      } else if (session.type === 'akkord') {
        const ex = current as ChordQualityExercise
        for (const p of ex.pitches) void engine.playNote(p, 0.8, 1.4)
      } else {
        const ex = current as MelodyExercise
        // Tonic as anchor, then the melody.
        void engine.playNote(ex.tonic, 0.7, 0.7)
        ex.pitches.forEach((p, i) => {
          window.setTimeout(() => void engine.playNote(p, 0.85, 0.55), 1100 + i * 600)
        })
      }
    }
  }, [session, current])

  const onAnswered = (correct: boolean) => {
    setSession((s) => (s ? { ...s, correct: s.correct + (correct ? 1 : 0) } : s))
  }

  const onMelodyComplete = (correctFirstTry: number, total: number) => {
    // A melody counts as correct when every tone was right on the first try.
    setSession((s) =>
      s
        ? {
            ...s,
            correct: s.correct + (correctFirstTry === total ? 1 : 0),
            melodyMessage: `${correctFirstTry} av ${total} toner riktig på første forsøk.`,
          }
        : s,
    )
  }

  const onNext = () => {
    setSession((s) => {
      if (!s) return s
      if (s.index + 1 >= s.exercises.length) {
        // Session done → record score-% (see module comment) and show results.
        const pct = Math.round((s.correct / s.exercises.length) * 100)
        const p = recordPractice(progressKey(s.type, s.level), pct)
        setBest(p.bestBpm)
        setResult({ type: s.type, level: s.level, correct: s.correct })
        return null
      }
      return { ...s, index: s.index + 1, melodyMessage: null }
    })
  }

  const changeLevel = (level: Level) => {
    if (!session) return
    start(session.type, level)
  }

  return (
    <AppShell>
      <main
        className="mx-auto max-w-3xl px-4 py-8 sm:py-12"
        style={{ ['--fag' as string]: 'var(--fag-gehor)' }}
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
              <Ear className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              Fag · Gehør
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl text-[var(--color-ivory)] sm:text-4xl">Gehør</h1>
          <p className="mt-2 max-w-xl text-[var(--color-muted)]">
            Tren øret i økter på {SESSION_LENGTH} oppgaver. Velg øvelse og nivå — lyden starter
            ved første klikk.
          </p>
        </header>

        {/* Menu: pick exercise type + level */}
        {!session && !result && (
          <div className="grid gap-3">
            {TYPES.map(({ id, label, description, icon: Icon }) => (
              <div
                key={id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="grid h-8 w-8 place-items-center rounded-lg"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--fag) 14%, transparent)',
                      color: 'var(--fag)',
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="font-display text-xl text-[var(--color-ivory)]">{label}</h2>
                </div>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {([1, 2, 3] as const).map((level) => {
                    const b = best[progressKey(id, level)]
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => start(id, level)}
                        className="group rounded-xl border border-[var(--color-border)] px-4 py-2 text-left transition-colors hover:bg-[var(--color-raised)]"
                      >
                        <span className="block text-sm font-medium text-[var(--color-ivory)]">
                          Nivå {level}
                        </span>
                        <span className="block text-xs text-[var(--color-muted)]">
                          {LEVEL_HINTS[id][level - 1]}
                          {b !== undefined && ` · beste ${b} %`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Running session */}
        {session && current && (
          <ExerciseCard
            // Remount per task AND per type/level so no answer state can leak
            // when the level selector rebuilds the session at the same index.
            key={`${session.type}-${session.level}-${session.index}`}
            progress={{ current: session.index + 1, total: session.exercises.length }}
            level={session.level}
            onLevelChange={changeLevel}
            onPlay={play}
            playLabel={
              session.type === 'intervall'
                ? 'Spill intervallet'
                : session.type === 'akkord'
                  ? 'Spill akkorden'
                  : 'Spill melodien'
            }
            options={
              session.type === 'intervall'
                ? (current as IntervalExercise).options.map((s) => ({
                    id: String(s),
                    label: intervalName(s),
                  }))
                : session.type === 'akkord'
                  ? (current as ChordQualityExercise).options.map((q) => ({
                      id: q || 'dur',
                      label: QUALITY_LABELS[q] ?? q,
                    }))
                  : undefined
            }
            correctId={
              session.type === 'intervall'
                ? String((current as IntervalExercise).answer)
                : session.type === 'akkord'
                  ? (current as ChordQualityExercise).answer || 'dur'
                  : undefined
            }
            onAnswered={onAnswered}
            answeredMessage={session.type === 'melodi' ? session.melodyMessage : undefined}
            onNext={onNext}
            isLast={session.index + 1 >= session.exercises.length}
          >
            {session.type === 'melodi' && (
              <AnswerKeyboard
                melody={(current as MelodyExercise).pitches}
                onComplete={onMelodyComplete}
                resetKey={session.index}
              />
            )}
          </ExerciseCard>
        )}

        {/* Session result */}
        {result && (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              {TYPES.find((t) => t.id === result.type)?.label} · Nivå {result.level}
            </p>
            <p className="mt-3 font-display text-4xl text-[var(--color-ivory)]">
              {result.correct} av {SESSION_LENGTH}
            </p>
            <p
              className={cn(
                'mt-2 text-sm',
                result.correct >= 8 ? 'text-[#6BD08A]' : 'text-[var(--color-muted)]',
              )}
            >
              {result.correct === SESSION_LENGTH
                ? 'Perfekt økt!'
                : result.correct >= 8
                  ? 'Sterkt — nesten helt rent.'
                  : result.correct >= 5
                    ? 'God trening — én økt til?'
                    : 'Gehør bygges én økt om gangen. Prøv igjen!'}
              {best[progressKey(result.type, result.level)] !== undefined &&
                ` Beste: ${best[progressKey(result.type, result.level)]} %.`}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => start(result.type, result.level)}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--fag-gehor)] px-5 py-2.5 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" />
                Øv igjen
              </button>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
              >
                Velg øvelse
              </button>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  )
}
