// ── Ear-training exercise generators (pure, no audio) ────────────────────────
//
// Deterministic generators for the three gehør exercise types: interval
// recognition, chord-quality recognition and melodic dictation. Every generator
// takes an explicit seeded RNG — Math.random is banned in testable code, so the
// same seed always yields the same session (and tests can assert level
// constraints over many deterministic samples). The UI seeds one RNG per
// session (e.g. from Date.now()) and draws 10 exercises from it.

import { pitchClass } from '../music'
import { scalePitches, chordPitches } from '../theory/diatonic'

export type Rng = () => number
export type Level = 1 | 2 | 3

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────────────────

/** Hash an arbitrary seed (string/number/undefined) down to a 32-bit int. */
function hashSeed(seed: number | string | undefined): number {
  if (seed === undefined) return 0x9e3779b9
  if (typeof seed === 'number') return seed >>> 0
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 — small, fast, deterministic PRNG returning floats in [0, 1). */
function mulberry32(a: number): Rng {
  let state = a >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A fresh seeded RNG — same seed always yields the same sequence. */
export function createRng(seed: number | string | undefined): Rng {
  return mulberry32(hashSeed(seed))
}

// Integer in [lo, hi] inclusive.
function randInt(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1))
}

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Fisher–Yates with a seeded RNG. */
export function seededShuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Interval recognition ─────────────────────────────────────────────────────

export interface IntervalExercise {
  /** The two notes to play, in playing order (may descend on level 2+). */
  notes: [number, number]
  /** Correct answer: the interval in semitones (always positive). */
  answer: number
  /** Multiple-choice semitone options, shuffled, containing `answer`. */
  options: number[]
}

const OPTION_COUNT = 4

// Pick `count` unique options from [lo, hi] that include `answer`.
function semitoneOptions(rng: Rng, answer: number, lo: number, hi: number): number[] {
  const opts = new Set<number>([answer])
  while (opts.size < Math.min(OPTION_COUNT, hi - lo + 1)) {
    opts.add(randInt(rng, lo, hi))
  }
  return seededShuffle([...opts], rng)
}

/**
 * Interval exercise per level:
 *   1 — ascending only, within the octave (sekund–oktav: 1–12 semitones)
 *   2 — ascending or descending, within the octave
 *   3 — also compound intervals up to a major tenth (1–16 semitones)
 */
export function intervalExercise(level: Level, rng: Rng): IntervalExercise {
  const maxSemitones = level === 3 ? 16 : 12
  const answer = randInt(rng, 1, maxSemitones)
  const descending = level >= 2 && rng() < 0.5
  // Keep both notes comfortably on the keyboard (C3–C6).
  const low = randInt(rng, 48, 84 - answer)
  const notes: [number, number] = descending ? [low + answer, low] : [low, low + answer]
  return { notes, answer, options: semitoneOptions(rng, answer, 1, maxSemitones) }
}

// ── Chord-quality recognition ────────────────────────────────────────────────

export interface ChordQualityExercise {
  /** The chord's MIDI pitches (played together). */
  pitches: number[]
  /** Correct answer: the quality string ('' = dur, 'm' = moll, …). */
  answer: string
  /** All qualities in play at this level — the answer buttons. */
  options: string[]
}

const CHORD_LEVEL_QUALITIES: Record<Level, string[]> = {
  1: ['', 'm'],
  2: ['', 'm', '7', 'maj7', 'm7'],
  3: ['', 'm', '7', 'maj7', 'm7', 'dim', 'sus4', 'add9'],
}

/**
 * Chord-quality exercise per level:
 *   1 — dur/moll · 2 — + 7/maj7/m7 · 3 — + dim/sus4/add9.
 * Options are the level's full quality list (stable button layout).
 */
export function chordQualityExercise(level: Level, rng: Rng): ChordQualityExercise {
  const qualities = CHORD_LEVEL_QUALITIES[level]
  const answer = pick(rng, qualities)
  const root = randInt(rng, 48, 67) // C3–G4: voicings stay within the keyboard
  return { pitches: chordPitches(root, answer), answer, options: [...qualities] }
}

// ── Melodic dictation ────────────────────────────────────────────────────────

export interface MelodyExercise {
  /** The melody, in playing order. */
  pitches: number[]
  /** Tonic reference note (MIDI) — played first so the ear has an anchor. */
  tonic: number
}

/** Widest leap allowed at each level, in SEMITONES. Level 2 stops at a perfect
 * fourth: a scale step of three degrees can span a tritone (F→B), which is not
 * a dictation interval for a second-level ear. */
const MAX_LEAP_SEMITONES: Record<Level, number> = { 1: 2, 2: 5, 3: 12 }

/**
 * Melody exercise per level:
 *   1 — 3 notes, C major, stepwise (adjacent scale degrees), from the tonic
 *   2 — 5 notes, C major, leaps up to a fourth allowed
 *   3 — 7 notes, a random major key, leaps allowed
 * All notes stay diatonic and within roughly one octave around the tonic.
 * Consecutive notes are always DIFFERENT: the walk is clamped to the degree
 * window, and a step that the clamp would swallow (leaving the melody sitting
 * on the same note) is redrawn — a repeated tone is not a dictation interval.
 */
export function melodyExercise(level: Level, rng: Rng): MelodyExercise {
  const tonicPc = level === 3 ? randInt(rng, 0, 11) : 0
  // Tonic near middle C: the octave starting at C4 (60) shifted to the key.
  const tonic = 60 + tonicPc
  const scale = scalePitches(tonicPc, 'major')
  const length = level === 1 ? 3 : level === 2 ? 5 : 7
  const maxLeap = level === 1 ? 1 : 3 // in scale steps

  // Walk scale-degree indices; degree d maps to MIDI via octave folding so the
  // melody stays within [tonic - 5, tonic + 12].
  const degreeToMidi = (d: number): number => {
    const octave = Math.floor(d / 7)
    const pc = scale[((d % 7) + 7) % 7]
    // Nearest instance of pc in the octave anchored at tonic + 12*octave.
    const base = tonic + 12 * octave
    return base + pitchClass(pc - tonic)
  }

  const maxSemitones = MAX_LEAP_SEMITONES[level]
  // Clamped landing degree for a step, and whether it is a usable move: it must
  // actually move (the clamp must not swallow it) and stay inside the level's
  // semitone reach.
  const landing = (from: number, step: number) => Math.max(-3, Math.min(7, from + step))
  const usable = (from: number, step: number) => {
    const to = landing(from, step)
    return to !== from && Math.abs(degreeToMidi(to) - degreeToMidi(from)) <= maxSemitones
  }

  let degree = 0 // start on the tonic
  const pitches: number[] = [degreeToMidi(degree)]
  for (let i = 1; i < length; i++) {
    let step = 0
    // Redraw while the clamp would repeat the note or the leap is too wide.
    for (let attempt = 0; attempt < 16 && !usable(degree, step); attempt++) {
      step = randInt(rng, -maxLeap, maxLeap)
    }
    if (!usable(degree, step)) {
      // Deterministic fallback (the RNG kept missing): the smallest usable
      // move, trying upwards first — at the top of the window only down works.
      const fallback = [1, -1, 2, -2, 3, -3].find((s) => usable(degree, s))
      if (fallback === undefined) break // no legal move at all — end the melody
      step = fallback
    }
    degree = landing(degree, step)
    pitches.push(degreeToMidi(degree))
  }
  return { pitches, tonic }
}
