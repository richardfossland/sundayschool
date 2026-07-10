'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { HandFilter, SongNote } from '@/types/song'
import { getEngine } from './engine'

// ── Vent-modus (wait-mode) trainer ───────────────────────────────────────────
// Steps through a song's note onsets, advancing only when the player hits the
// expected key(s). Input comes from Web MIDI OR clicking the on-screen keyboard
// (the same `input()` pipeline), so it works with or without hardware. Ported
// from SundayLicks and EXTENDED for full songs:
//   (a) steps are built from an optional beat-range (a section) + a hand filter,
//       so a learner can drill one section and/or one hand;
//   (b) `currentStepBeat` is exposed so the falling-notes canvas can freeze on
//       the beat we're waiting at (the transport is stopped in wait-mode);
//   (c) per-hand mode: when a single hand is gated, the OTHER hand's notes are
//       sounded automatically as accompaniment as each step activates — the
//       engine "plays the other hand" while you're only responsible for yours.

export type Feedback = 'hit' | 'miss'

const EPS = 1e-6

export interface WaitStep {
  /** Beat of this step's onset (all gated notes share this onset). */
  beat: number
  /** The gated-hand pitches the player must press to advance. */
  pitches: Set<number>
  /** Other-hand pitches to sound when this step activates (per-hand mode). */
  accompaniment: number[]
}

export interface WaitModeOptions {
  /** Restrict gating to a beat range [start, end) — e.g. the active section. */
  range?: [number, number] | null
  /** Which hand the player must play. 'both' gates every note; 'L'/'R' gates
   * that hand and sounds the other as accompaniment. */
  hand?: HandFilter
  /** Called each time the last step is cleared (one full pass done). */
  onLoopComplete?: () => void
}

export interface WaitMode {
  active: boolean
  step: number
  total: number
  /** Pitches to play at the current step (outlined on the keyboard). */
  expected: Set<number>
  /** Transient hit/miss feedback per pressed key. */
  feedback: Map<number, Feedback>
  /** Beat the trainer is frozen at, or null when inactive — lets the falling
   * canvas scroll to and hold on the waiting position. */
  currentStepBeat: number | null
  start: () => void
  stop: () => void
  input: (midi: number) => void
}

/**
 * Group notes into ordered wait-steps. Notes are filtered to `range` (onset in
 * [lo, hi)) and to the gated `hand`; onsets that coincide (within 1ms) become a
 * single chord-step. In single-hand mode, each other-hand note is attached to
 * the step whose interval it falls in, so it sounds as accompaniment.
 */
export function buildSteps(
  notes: SongNote[],
  range: [number, number] | null | undefined,
  hand: HandFilter,
): WaitStep[] {
  const [lo, hi] = range ?? [-Infinity, Infinity]
  const inRange = (t: number) => t >= lo - EPS && t < hi - EPS
  const gated = notes.filter((n) => inRange(n.t) && (hand === 'both' || n.h === hand))
  const other = hand === 'both' ? [] : notes.filter((n) => inRange(n.t) && n.h !== hand)

  const byOnset = new Map<number, Set<number>>()
  for (const n of gated) {
    const key = Math.round(n.t * 1000)
    if (!byOnset.has(key)) byOnset.set(key, new Set())
    byOnset.get(key)!.add(n.p)
  }
  const steps: WaitStep[] = [...byOnset.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, pitches]) => ({ beat: k / 1000, pitches, accompaniment: [] as number[] }))

  // Attach every other-hand note to the step interval (prevBeat, thisBeat] it
  // leads into; notes before the first step ride in with step 0.
  for (let i = 0; i < steps.length; i++) {
    const prev = i === 0 ? -Infinity : steps[i - 1].beat
    const cur = steps[i].beat
    for (const n of other) {
      if (n.t > prev + EPS && n.t <= cur + EPS) steps[i].accompaniment.push(n.p)
    }
  }
  return steps
}

export function useWaitMode(notes: SongNote[], options: WaitModeOptions = {}): WaitMode {
  const { range, hand = 'both', onLoopComplete } = options
  const rangeKey = range ? `${range[0]}:${range[1]}` : 'full'
  const steps = useMemo(
    () => buildSteps(notes, range, hand),
    // rangeKey stringifies the tuple so a new [a,b] identity doesn't rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notes, rangeKey, hand],
  )

  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [feedback, setFeedback] = useState<Map<number, Feedback>>(new Map())

  const hitsRef = useRef<Set<number>>(new Set())
  const stepsRef = useRef(steps)
  stepsRef.current = steps
  const stepRef = useRef(0)
  stepRef.current = step
  const activeRef = useRef(false)
  activeRef.current = active
  const onLoopRef = useRef(onLoopComplete)
  onLoopRef.current = onLoopComplete
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Reset to the top whenever the step set changes (song / key / hand / range).
  useEffect(() => {
    setStep(0)
    hitsRef.current = new Set()
  }, [steps])

  // Sound the accompaniment (other hand) each time a step activates.
  useEffect(() => {
    if (!active) return
    const s = stepsRef.current[step]
    if (!s) return
    for (const p of s.accompaniment) void getEngine().playNote(p, 0.45)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, active])

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout)
    },
    [],
  )

  const flash = useCallback((midi: number, kind: Feedback) => {
    setFeedback((prev) => {
      const next = new Map(prev)
      next.set(midi, kind)
      return next
    })
    const t = setTimeout(() => {
      setFeedback((prev) => {
        const next = new Map(prev)
        next.delete(midi)
        return next
      })
    }, 280)
    timers.current.push(t)
  }, [])

  const start = useCallback(() => {
    hitsRef.current = new Set()
    setStep(0)
    setActive(true)
  }, [])

  const stop = useCallback(() => {
    setActive(false)
    hitsRef.current = new Set()
    setFeedback(new Map())
  }, [])

  const input = useCallback(
    (midi: number) => {
      if (!activeRef.current) {
        void getEngine().playNote(midi)
        return
      }
      const expected = stepsRef.current[stepRef.current]?.pitches
      if (!expected) return
      if (expected.has(midi)) {
        void getEngine().playNote(midi)
        flash(midi, 'hit')
        hitsRef.current.add(midi)
        // Every expected pitch for this step hit → advance.
        if ([...expected].every((p) => hitsRef.current.has(p))) {
          hitsRef.current = new Set()
          const nextStep = stepRef.current + 1
          if (nextStep >= stepsRef.current.length) {
            setStep(0)
            onLoopRef.current?.()
          } else {
            setStep(nextStep)
          }
        }
      } else {
        flash(midi, 'miss')
      }
    },
    [flash],
  )

  const expected = active ? (steps[step]?.pitches ?? new Set<number>()) : new Set<number>()
  const currentStepBeat = active ? (steps[step]?.beat ?? null) : null

  return { active, step, total: steps.length, expected, feedback, currentStepBeat, start, stop, input }
}
