// ── Chord matching (pure, no audio) ─────────────────────────────────────────
//
// The heart of besifringsmodus: given the MIDI notes a player is holding down
// and the chord they're aiming for, decide whether the grip is `valid`,
// `partial` (on the right track but incomplete) or `wrong` (a foreign tone or an
// illegal bass). Four difficulty levels loosen the rules progressively:
//
//   1  Grunnstilling  — root position: lowest note IS the root, every held tone
//                        is a chord tone, and at least root + third (+ 7th when
//                        the quality carries one) are present.
//   2  Inversjoner    — free bass within the chord; a slash chord's `b` must be
//                        the lowest note. Any inversion/octave is accepted.
//   3  Utvidelser     — as level 2, but extra colour tones (9/11/13, i.e. the
//                        sus tones too) are tolerated on top of the chord.
//   4  Gospel         — rootless: the root becomes optional, only the guide
//                        tones (3 and 7, or 3 and 5 for a plain triad) are
//                        required, bass is free and extensions are tolerated.
//
// Pure and DOM-free, so the whole matrix of inversions/qualities/levels is
// exercised in a plain Node test.

import type { SongChord } from '@/types/song'
import { chordPitchClasses, pitchClass } from './music'

export type ChordMatch = 'valid' | 'partial' | 'wrong'
export type ChordLevel = 1 | 2 | 3 | 4

// Semitone offset of a quality's "third" slot from the root. Sus qualities put
// the suspended tone in this slot (there is no true third); a power chord ('5')
// has no third at all (null).
const THIRD: Record<string, number | null> = {
  '': 4, m: 3, '7': 4, maj7: 4, m7: 3, m7b5: 3, dim: 3, dim7: 3,
  sus4: 5, sus2: 2, '6': 4, m6: 3, '9': 4, m9: 3, maj9: 4, add9: 4,
  '7sus4': 5, '5': null, aug: 4,
}

// Semitone offset of a quality's "seventh" slot (6ths occupy it too). Qualities
// absent from this table have no seventh.
const SEVENTH: Record<string, number> = {
  '7': 10, maj7: 11, m7: 10, m7b5: 10, dim7: 9, '6': 9, m6: 9,
  '9': 10, m9: 10, maj9: 11, '7sus4': 10,
}

// Semitone offset of the "fifth" slot — used as the second guide tone for a
// plain triad at gospel level (a rootless triad = 3 + 5).
const FIFTH: Record<string, number> = { m7b5: 6, dim: 6, dim7: 6, aug: 8 }

// Colour tones tolerated as ADDED tension at level 3+ (9th, 11th, 13th — which
// also cover sus2/sus4 neighbours). Deliberately small so genuine foreign tones
// (e.g. a neighbour chord's leading tone) still read as wrong.
const EXTENSION_OFFSETS = [2, 5, 9]

interface ChordTones {
  root: number
  third: number | null
  fifth: number
  seventh: number | null
  chordPcs: Set<number>
  allowedWithExt: Set<number>
}

function tonesOf(chord: SongChord): ChordTones {
  const root = pitchClass(chord.r)
  // `?? 4` alone would misread a null third (power chord) as a major third, so
  // distinguish "known quality" (may be null) from "unknown" (default major).
  const thirdIv = chord.q in THIRD ? THIRD[chord.q] : 4
  const third = thirdIv === null ? null : pitchClass(root + thirdIv)
  const fifthIv = FIFTH[chord.q] ?? 7
  const fifth = pitchClass(root + fifthIv)
  const seventh = chord.q in SEVENTH ? pitchClass(root + SEVENTH[chord.q]) : null

  const chordPcs = new Set(chordPitchClasses(chord.r, chord.q))
  const allowedWithExt = new Set(chordPcs)
  for (const o of EXTENSION_OFFSETS) allowedWithExt.add(pitchClass(root + o))

  return { root, third, fifth, seventh, chordPcs, allowedWithExt }
}

/**
 * Classify a held grip against a target chord at a difficulty level.
 * `held` is a set of MIDI note numbers; only pitch classes and the lowest note
 * matter. Empty (nothing pressed) is `partial` — on the right track, not wrong.
 */
export function matchChord(held: Set<number>, chord: SongChord, level: ChordLevel): ChordMatch {
  const tones = tonesOf(chord)
  const heldArr = [...held].sort((a, b) => a - b)
  const heldPcs = new Set(heldArr.map(pitchClass))

  // Which pitch classes are legal at this level (extensions tolerated at 3+).
  const allowed = level >= 3 ? tones.allowedWithExt : tones.chordPcs

  // Any foreign tone → wrong (a neighbour-chord note that doesn't belong).
  for (const pc of heldPcs) {
    if (!allowed.has(pc)) return 'wrong'
  }

  // Nothing pressed yet: not wrong, just incomplete.
  if (heldArr.length === 0) return 'partial'

  // Bass constraint.
  const lowestPc = pitchClass(heldArr[0])
  if (level === 1) {
    // Root position: the lowest note must be the root.
    if (lowestPc !== tones.root) return 'wrong'
  } else if (level === 2 || level === 3) {
    // Free bass within the chord; a slash chord pins the lowest note to `b`.
    if (chord.b !== undefined && lowestPc !== pitchClass(chord.b)) return 'wrong'
  }
  // level 4: rootless gospel — the bass is free, no constraint.

  // Completeness.
  const hasThird = tones.third === null ? true : heldPcs.has(tones.third)
  const hasSeventh = tones.seventh === null ? true : heldPcs.has(tones.seventh)
  const hasRoot = heldPcs.has(tones.root)

  let complete: boolean
  if (level === 4) {
    // Rootless: guide tones only. Seventh chords need 3 + 7; triads need 3 + 5.
    const secondGuide = tones.seventh ?? tones.fifth
    complete = hasThird && heldPcs.has(secondGuide)
  } else {
    // Root position / inversions / extensions all still need the root present.
    complete = hasRoot && hasThird && hasSeventh
  }

  return complete ? 'valid' : 'partial'
}
