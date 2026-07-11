// ── Capo advisor (pure, no audio) ────────────────────────────────────────────
//
// Given a song's chord track (SOUNDING roots, i.e. the user's target key), find
// the capo fret that makes the grips easiest: for each capo 0..maxCapo the
// chords are transposed DOWN by the capo (pitch-class arithmetic — what the
// hands play), each looked up in the shape library, and the openness of the
// best grip summed over every chord occurrence (so frequent chords count more).
// A chord with no grip at all costs a large penalty, and each capo fret costs a
// little, so among near-equal options the LOWEST capo wins — a song in G/C/D
// stays at capo 0, while a song in F lands on capo 1 (E-form grips).

import type { SongChord } from '@/types/song'
import { pitchClass } from '../music'
import { openness, shapesFor, type Shape } from './chord-shapes'

/** Penalty for a chord that has no playable grip at this capo. */
const NO_SHAPE_PENALTY = -8
/** Cost per capo fret — prefers lower capos among near-equal scores. */
const CAPO_COST = 3

export interface CapoSuggestion {
  capo: number
  score: number
}

/**
 * The capo fret (0..maxCapo) giving the most open grips for these chords.
 * Ties resolve to the lowest capo. Empty chord lists suggest capo 0.
 */
export function bestCapo(chords: SongChord[], maxCapo = 7): CapoSuggestion {
  let best: CapoSuggestion = { capo: 0, score: -Infinity }
  for (let capo = 0; capo <= maxCapo; capo++) {
    let score = -CAPO_COST * capo
    for (const chord of chords) {
      const shapes = shapesFor(pitchClass(chord.r - capo), chord.q)
      // shapesFor is sorted best-first, so [0] is the grip a player would pick.
      score += shapes.length > 0 ? openness(shapes[0]) : NO_SHAPE_PENALTY
    }
    if (score > best.score) best = { capo, score }
  }
  return best
}

/**
 * The best grip per chord at a given capo, keyed by the chord's INDEX in the
 * input array. Roots are transposed down by the capo before lookup (the shape
 * is what the hands play; add the capo back to `shapePitches` for the sounding
 * MIDI notes). Chords with no grip are simply absent from the map. Slash-chord
 * basses are ignored — the plain shape is suggested.
 */
export function shapesAtCapo(chords: SongChord[], capo: number): Map<number, Shape> {
  const out = new Map<number, Shape>()
  chords.forEach((chord, i) => {
    const shapes = shapesFor(pitchClass(chord.r - capo), chord.q)
    if (shapes.length > 0) out.set(i, shapes[0])
  })
  return out
}
