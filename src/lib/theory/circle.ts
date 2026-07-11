// ── Circle of fifths (pure, no audio) ────────────────────────────────────────
//
// Data + geometry for the kvintsirkel: clockwise order (C at 12 o'clock, up a
// fifth per step), accidental counts per key (derived FROM lib/spelling.ts so
// the two can never disagree), relative minors, and neighbor lookup. The SVG
// point helper rounds coordinates — Math.sin/cos aren't bit-identical across
// JS engines, and unrounded floats stringify differently on the server vs. the
// browser, tripping a React hydration mismatch (learned the hard way in
// SundayLicks' circle-of-fifths).

import { pitchClass } from '../music'
import { keyAccidentals, keyNameForTonic, type KeyAccidentals } from '../spelling'

/** Pitch classes clockwise from C at the top: C G D A E B F#/Gb Db Ab Eb Bb F. */
export const CIRCLE_OF_FIFTHS: readonly number[] = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]

export interface CircleEntry {
  /** Major-key tonic pitch class. */
  pc: number
  /** Position 0–11 clockwise from the top (C = 0). */
  index: number
  /** Canonical major-key name, e.g. 'Eb'. */
  major: string
  /** Relative minor: pitch class + lowercase name, e.g. 'c' for Eb. */
  minorPc: number
  minor: string
  /** Key signature (count + '#'/'b'/null), consistent with spelling.ts. */
  accidentals: KeyAccidentals
}

/** One entry per major key, in circle-of-fifths (clockwise) order. */
export function circleEntries(): CircleEntry[] {
  return CIRCLE_OF_FIFTHS.map((pc, index) => {
    const major = keyNameForTonic(pc, 'major')
    const minorPc = relativeMinor(pc)
    return {
      pc,
      index,
      major,
      minorPc,
      minor: keyNameForTonic(minorPc, 'minor'),
      accidentals: keyAccidentals(major),
    }
  })
}

/** Relative minor of a major tonic (down a minor third). */
export function relativeMinor(majorPc: number): number {
  return pitchClass(majorPc + 9)
}

/** Relative major of a minor tonic (up a minor third). */
export function relativeMajor(minorPc: number): number {
  return pitchClass(minorPc + 3)
}

/** Clockwise position (0–11) of a pitch class on the circle. */
export function circleIndex(pc: number): number {
  return CIRCLE_OF_FIFTHS.indexOf(pitchClass(pc))
}

export interface Neighbors {
  /** One step clockwise — the dominant key (a fifth up). */
  dominant: number
  /** One step counterclockwise — the subdominant key (a fourth up / fifth down). */
  subdominant: number
}

/** The two adjacent keys on the circle — a key's closest harmonic neighbors. */
export function neighbors(keyPc: number): Neighbors {
  return {
    dominant: pitchClass(keyPc + 7),
    subdominant: pitchClass(keyPc + 5),
  }
}

/** Human label for a key signature, e.g. '3♭', '2♯' or 'ingen fortegn'. */
export function accidentalLabel(acc: KeyAccidentals): string {
  if (acc.type === null || acc.count === 0) return 'ingen fortegn'
  return `${acc.count}${acc.type === '#' ? '♯' : '♭'}`
}

// ── SVG geometry ─────────────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

/** Angle (degrees, clockwise from 12 o'clock) of position i of 12. */
export function angleForIndex(i: number, total = 12): number {
  return (360 / total) * i
}

/**
 * A point on a circle of radius `r` around (cx, cy) at `angleDeg` clockwise
 * from the top. Coordinates are rounded to 3 decimals for hydration safety
 * (see module comment).
 */
export function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180
  const round = (n: number) => Math.round(n * 1000) / 1000
  return { x: round(cx + r * Math.sin(rad)), y: round(cy - r * Math.cos(rad)) }
}
