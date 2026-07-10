// ── Keyboard geometry (pure) ────────────────────────────────────────────────
//
// The single source of truth for where each piano key sits, shared by the
// falling-notes canvas and the DOM keyboard so they always line up. Mirrors the
// classic layout: white keys are equal-width slots; black keys are ~60% as wide
// and centred on the boundary between the two white keys they sit above.

import { isBlackKey, pitchClass } from './music'

export interface KeyRect {
  midi: number
  isBlack: boolean
  x: number // left edge, px
  w: number // width, px
}

export interface KeyboardLayout {
  keys: KeyRect[] // ordered left→right (x ascending)
  totalWidth: number
}

/** Fraction of a white key's width that a black key spans (~60%). */
export const BLACK_KEY_RATIO = 0.6

/**
 * Lay out keys for the inclusive MIDI range [lowMidi, highMidi].
 * White keys tile at multiples of `whiteKeyWidth`; black keys straddle the
 * boundary between adjacent whites. Keys are returned sorted by x.
 */
export function keyboardLayout(lowMidi: number, highMidi: number, whiteKeyWidth: number): KeyboardLayout {
  const blackW = whiteKeyWidth * BLACK_KEY_RATIO

  const whites: number[] = []
  for (let m = lowMidi; m <= highMidi; m++) if (!isBlackKey(m)) whites.push(m)

  const keys: KeyRect[] = []
  whites.forEach((m, i) => {
    keys.push({ midi: m, isBlack: false, x: i * whiteKeyWidth, w: whiteKeyWidth })
    // A black key sits just above this white when the next semitone is black
    // and still inside the range; it centres on the right edge of this white.
    const bm = m + 1
    if (isBlackKey(bm) && bm <= highMidi) {
      keys.push({ midi: bm, isBlack: true, x: (i + 1) * whiteKeyWidth - blackW / 2, w: blackW })
    }
  })

  keys.sort((a, b) => a.x - b.x)
  return { keys, totalWidth: whites.length * whiteKeyWidth }
}

/**
 * Widen [min, max] outward to whole C-to-C octaves (and at least ~1.5 octaves),
 * so the keyboard always starts/ends on a C. Matches the reference keyboard's
 * padding; handy for deriving a range from the notes actually in play.
 */
export function padToC(min: number, max: number, minSpan = 18): [number, number] {
  let lo = min
  while (pitchClass(lo) !== 0) lo--
  let hi = max
  while (pitchClass(hi) !== 0) hi++
  if (hi - lo < minSpan) hi = lo + minSpan
  return [lo, hi]
}
