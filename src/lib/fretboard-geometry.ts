// ── Fretboard geometry (pure, no audio, no DOM) ──────────────────────────────
//
// The single source of truth for where each string + fret sits on a schematic
// fretboard, and for turning a MIDI pitch into a playable {string, fret}. Kept
// GENERAL on purpose: bass uses it now (E-A-D-G), and the guitar-melody fag will
// reuse the exact same helpers later with GUITAR_STANDARD.
//
// Layout convention (documented so the renderer + the interactive board agree):
//   • Strings are drawn as HORIZONTAL rows. The LOW string (index 0, e.g. low E)
//     sits at the BOTTOM — matching how a bass hangs and how tab is read, low
//     string closest to the player. So stringY is DESCENDING in index
//     (stringY[0] is the largest y, the last string the smallest).
//   • Frets are spaced LINEARLY across the width. Real frets shrink
//     logarithmically toward the body, but for a compact on-screen diagram the
//     fret NUMBER carries the meaning, and even spacing keeps every fret wide
//     enough to tap on a phone. fretX[0] is the nut (open), fretX[fretCount] the
//     far edge.

/** Open-string MIDI pitches, low→high. Index 0 is the lowest (drawn at bottom). */
export const BASS_EADG = [28, 33, 38, 43] // E1, A1, D2, G2
export const GUITAR_STANDARD = [40, 45, 50, 55, 59, 64] // E2, A2, D3, G3, B3, E4

/** How many frets `bestPosition` considers by default (a 24-fret neck). */
export const DEFAULT_FRET_COUNT = 24

export interface FretPosition {
  string: number // string index (0 = lowest)
  fret: number // 0 = open string
}

export interface FretboardLayout {
  /** y (px) of each string's centre line, indexed by string. Descending: the
   * low string (index 0) is at the bottom (largest y). */
  stringY: number[]
  /** x (px) of each fret line, index 0..fretCount (0 = nut). */
  fretX: number[]
  /** Screen position of a string+fret. Fret 0 sits at the nut; a fretted note
   * (fret ≥ 1) is centred between its two fret lines, where a finger presses. */
  posOf(stringIdx: number, fret: number): { x: number; y: number }
}

/**
 * Lay out `tuning.length` horizontal strings and `fretCount` linearly-spaced
 * frets inside a widthPx × heightPx box. Strings are evenly distributed with a
 * little vertical inset so the top/bottom strings aren't flush with the edge.
 */
export function fretboardLayout(
  tuning: number[],
  fretCount: number,
  widthPx: number,
  heightPx: number,
): FretboardLayout {
  const n = Math.max(1, tuning.length)
  const frets = Math.max(1, fretCount)

  // Even string rows with a 12% inset top+bottom; index 0 (low) at the bottom.
  const inset = heightPx * 0.12
  const usable = heightPx - inset * 2
  const gap = n > 1 ? usable / (n - 1) : 0
  const stringY: number[] = []
  for (let i = 0; i < n; i++) {
    // i = 0 → bottom (largest y); i = n-1 → top (smallest y).
    stringY.push(heightPx - inset - i * gap)
  }

  const fretX: number[] = []
  for (let f = 0; f <= frets; f++) fretX.push((f / frets) * widthPx)

  const posOf = (stringIdx: number, fret: number) => {
    const s = Math.min(Math.max(0, stringIdx), n - 1)
    const f = Math.min(Math.max(0, fret), frets)
    // Open notes sit on the nut; fretted notes between the surrounding frets.
    const x = f === 0 ? fretX[0] : (fretX[f - 1] + fretX[f]) / 2
    return { x, y: stringY[s] }
  }

  return { stringY, fretX, posOf }
}

/** Manhattan-ish distance between two positions (a fret jump costs 1, crossing a
 * string costs 2 — string changes are physically bigger leaps for a bassist). */
function positionDistance(a: FretPosition, b: FretPosition): number {
  return Math.abs(a.fret - b.fret) + Math.abs(a.string - b.string) * 2
}

/**
 * Best {string, fret} to play `pitch` on `tuning`. Preference order:
 *   1. position continuity — stay near `prev` when given (smooth playing);
 *   2. low frets — favour the open..5 "home" band, then the lowest fret;
 * so with no `prev` the lowest comfortable position wins, and with a `prev` the
 * closest reachable position wins (ties broken toward the low band). Returns null
 * when the pitch can't be produced anywhere on the neck (out of range).
 */
export function bestPosition(
  pitch: number,
  tuning: number[],
  prev?: FretPosition,
  maxFret: number = DEFAULT_FRET_COUNT,
): FretPosition | null {
  const candidates: FretPosition[] = []
  for (let s = 0; s < tuning.length; s++) {
    const fret = pitch - tuning[s]
    if (fret >= 0 && fret <= maxFret) candidates.push({ string: s, fret })
  }
  if (candidates.length === 0) return null

  // Penalty for leaving the open..5 home band (0 inside it, grows above).
  const bandPenalty = (fret: number) => (fret <= 5 ? 0 : fret - 5)

  const score = (pos: FretPosition) => {
    if (prev) {
      // Continuity dominates; the band penalty only breaks ties.
      return positionDistance(pos, prev) * 10 + bandPenalty(pos.fret)
    }
    // No history: prefer the home band, then the lowest fret overall.
    return bandPenalty(pos.fret) * 10 + pos.fret
  }

  let best = candidates[0]
  let bestScore = score(best)
  for (let i = 1; i < candidates.length; i++) {
    const sc = score(candidates[i])
    if (sc < bestScore) {
      bestScore = sc
      best = candidates[i]
    }
  }
  return best
}
