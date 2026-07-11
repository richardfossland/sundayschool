// ── Intervals (pure, no audio) ───────────────────────────────────────────────
//
// Semitone-count → Norwegian interval name («ren kvint», «stor ters», …) plus a
// quality/number decomposition. Follows the SundayLicks theory-module style:
// stateless arithmetic, composes with lib/music.ts without duplicating it.
// Compound intervals (over an octave) are supported up to two octaves — the
// ear-training level 3 exercises quiz up to a major tenth («stor desim»).

/** Interval quality. 'tritonus' is its own thing in Norwegian usage — the
 * augmented fourth / diminished fifth is simply called «tritonus». */
export type IntervalQuality = 'ren' | 'liten' | 'stor' | 'tritonus'

export interface IntervalParts {
  quality: IntervalQuality
  /** Diatonic number: 1 = prim, 2 = sekund … 8 = oktav, 9 = none, 10 = desim … */
  number: number
}

// Simple-interval table, indexed by semitones 0–12. The tritone is decomposed
// as an (augmented) fourth by convention.
const SIMPLE: IntervalParts[] = [
  { quality: 'ren', number: 1 }, // 0
  { quality: 'liten', number: 2 }, // 1
  { quality: 'stor', number: 2 }, // 2
  { quality: 'liten', number: 3 }, // 3
  { quality: 'stor', number: 3 }, // 4
  { quality: 'ren', number: 4 }, // 5
  { quality: 'tritonus', number: 4 }, // 6
  { quality: 'ren', number: 5 }, // 7
  { quality: 'liten', number: 6 }, // 8
  { quality: 'stor', number: 6 }, // 9
  { quality: 'liten', number: 7 }, // 10
  { quality: 'stor', number: 7 }, // 11
  { quality: 'ren', number: 8 }, // 12
]

// Norwegian names of the diatonic numbers, indexed by number (1-based).
const NUMBER_NAMES = [
  '', 'prim', 'sekund', 'ters', 'kvart', 'kvint', 'sekst', 'septim', 'oktav',
  'none', 'desim', 'undesim', 'duodesim', 'tredesim', 'kvartdesim', 'kvintdesim',
]

/** Largest semitone count this module can name (two octaves). */
export const MAX_INTERVAL = 24

/**
 * Quality/number decomposition of an interval given in semitones (0–24).
 * Compound intervals keep the simple interval's quality and add 7 to the
 * number per octave (13 semitones → { stor? no — liten, 9 } = liten none).
 */
export function intervalParts(semitones: number): IntervalParts {
  const s = Math.abs(Math.round(semitones))
  if (s > MAX_INTERVAL) throw new RangeError(`intervalParts: ${semitones} is out of range (0–${MAX_INTERVAL})`)
  if (s <= 12) return { ...SIMPLE[s] }
  const base = SIMPLE[s - 12]
  return { quality: base.quality, number: base.number + 7 }
}

/**
 * Norwegian interval name for a semitone count, e.g. 7 → «ren kvint»,
 * 4 → «stor ters», 6 → «tritonus», 14 → «stor none», 24 → «to oktaver».
 * Direction-agnostic (negative input = same name).
 */
export function intervalName(semitones: number): string {
  const s = Math.abs(Math.round(semitones))
  if (s > MAX_INTERVAL) throw new RangeError(`intervalName: ${semitones} is out of range (0–${MAX_INTERVAL})`)
  if (s === 24) return 'to oktaver'
  const { quality, number } = intervalParts(s)
  if (quality === 'tritonus') return number === 4 ? 'tritonus' : 'oktav + tritonus'
  return `${quality} ${NUMBER_NAMES[number]}`
}

/** Absolute distance in semitones between two MIDI notes (order-agnostic). */
export function intervalBetween(a: number, b: number): number {
  return Math.abs(Math.round(b) - Math.round(a))
}

/** All simple intervals (1–12 semitones) with their names — handy for pickers. */
export const SIMPLE_INTERVALS: { semitones: number; name: string }[] = Array.from(
  { length: 12 },
  (_, i) => ({ semitones: i + 1, name: intervalName(i + 1) }),
)
