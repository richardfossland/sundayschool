'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SongChord } from '@/types/song'
import { getEngine } from './engine'
import { matchChord, type ChordLevel, type ChordMatch } from './chord-match'

// ── Besifring-modus (chord mode) trainer ─────────────────────────────────────
// Steps through a song's chord track, advancing only when the player HOLDS a
// grip that matches the current chord at the chosen level. Unlike wait-mode
// (which fires on each note-on), chord mode watches the whole held set: notes are
// added on note-on and removed on note-off, and the grip is validated a short
// debounce after the last change so an arpeggiated chord (rolled one note at a
// time) still counts. Input arrives from Web MIDI OR clicking the on-screen
// keyboard (a click TOGGLES a held key). On a match the chord is sounded and the
// trainer advances; a foreign tone flashes red.

/** ms after the last key change before the held grip is judged (rolls allowed). */
const SETTLE_MS = 120
const FEEDBACK_MS = 550

export interface ChordMode {
  active: boolean
  index: number
  total: number
  currentChord: SongChord | null
  level: ChordLevel
  setLevel: (l: ChordLevel) => void
  feedback: ChordMatch | null // 'valid' | 'wrong' (transient); null while building
  /** MIDI notes currently held (for the keyboard overlay). */
  held: Set<number>
  /** 0..1 completion through the chord list. */
  progress: number
  /** Beat the trainer is frozen at (the active chord's onset), or null. */
  currentBeat: number | null
  start: () => void
  stop: () => void
  noteOn: (midi: number) => void
  noteOff: (midi: number) => void
  /** On-screen keyboard click: toggle a held key. */
  toggleHold: (midi: number) => void
}

export interface ChordModeOptions {
  /** Restrict stepping to a beat range [start, end) — e.g. the active section. */
  range?: [number, number] | null
  onLoopComplete?: () => void
}

const EPS = 1e-6

/** The chords whose onset falls inside `range` (or all of them), in time order. */
export function chordSteps(chords: SongChord[], range: [number, number] | null | undefined): SongChord[] {
  const [lo, hi] = range ?? [-Infinity, Infinity]
  return chords
    .filter((c) => c.t >= lo - EPS && c.t < hi - EPS)
    .slice()
    .sort((a, b) => a.t - b.t)
}

export function useChordMode(chords: SongChord[], options: ChordModeOptions = {}): ChordMode {
  const { range, onLoopComplete } = options
  const rangeKey = range ? `${range[0]}:${range[1]}` : 'full'
  const steps = useMemo(
    () => chordSteps(chords, range),
    // rangeKey stringifies the tuple so a new [a,b] identity doesn't rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chords, rangeKey],
  )

  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)
  const [level, setLevel] = useState<ChordLevel>(1)
  const [feedback, setFeedback] = useState<ChordMatch | null>(null)
  const [heldState, setHeldState] = useState<Set<number>>(new Set())

  // Refs for the debounced evaluator (which runs outside React's render cycle).
  const heldRef = useRef<Set<number>>(new Set())
  const stepsRef = useRef(steps)
  stepsRef.current = steps
  const indexRef = useRef(0)
  indexRef.current = index
  const levelRef = useRef<ChordLevel>(level)
  levelRef.current = level
  const activeRef = useRef(false)
  activeRef.current = active
  const onLoopRef = useRef(onLoopComplete)
  onLoopRef.current = onLoopComplete
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset to the top whenever the step set changes (song / range).
  useEffect(() => {
    setIndex(0)
    heldRef.current = new Set()
    setHeldState(new Set())
  }, [steps])

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current)
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    },
    [],
  )

  const flash = useCallback((kind: ChordMatch | null) => {
    setFeedback(kind)
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    if (kind) {
      feedbackTimer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS)
    }
  }, [])

  const advance = useCallback(() => {
    heldRef.current = new Set()
    setHeldState(new Set())
    const next = indexRef.current + 1
    if (next >= stepsRef.current.length) {
      setIndex(0)
      onLoopRef.current?.()
    } else {
      setIndex(next)
    }
  }, [])

  // Judge the held grip a short settle after the last change.
  const evaluate = useCallback(() => {
    if (!activeRef.current) return
    const chord = stepsRef.current[indexRef.current]
    if (!chord) return
    const held = heldRef.current
    if (held.size === 0) return
    const result = matchChord(held, chord, levelRef.current)
    if (result === 'valid') {
      // Sound the matched grip as confirmation, then move on.
      for (const m of held) void getEngine().playNote(m, 0.55)
      flash('valid')
      advance()
    } else if (result === 'wrong') {
      flash('wrong')
    }
    // 'partial' — keep waiting silently for more notes.
  }, [advance, flash])

  const scheduleEval = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(evaluate, SETTLE_MS)
  }, [evaluate])

  const noteOn = useCallback(
    (midi: number) => {
      const next = new Set(heldRef.current)
      next.add(midi)
      heldRef.current = next
      setHeldState(next)
      scheduleEval()
    },
    [scheduleEval],
  )

  const noteOff = useCallback(
    (midi: number) => {
      const next = new Set(heldRef.current)
      next.delete(midi)
      heldRef.current = next
      setHeldState(next)
      scheduleEval()
    },
    [scheduleEval],
  )

  const toggleHold = useCallback(
    (midi: number) => {
      if (heldRef.current.has(midi)) noteOff(midi)
      else noteOn(midi)
    },
    [noteOn, noteOff],
  )

  const start = useCallback(() => {
    heldRef.current = new Set()
    setHeldState(new Set())
    setIndex(0)
    setFeedback(null)
    setActive(true)
  }, [])

  const stop = useCallback(() => {
    setActive(false)
    heldRef.current = new Set()
    setHeldState(new Set())
    setFeedback(null)
    if (settleTimer.current) clearTimeout(settleTimer.current)
  }, [])

  const currentChord = active ? (steps[index] ?? null) : null
  const currentBeat = currentChord ? currentChord.t : null
  const progress = steps.length > 0 ? index / steps.length : 0

  return {
    active,
    index,
    total: steps.length,
    currentChord,
    level,
    setLevel,
    feedback,
    held: heldState,
    progress,
    currentBeat,
    start,
    stop,
    noteOn,
    noteOff,
    toggleHold,
  }
}
