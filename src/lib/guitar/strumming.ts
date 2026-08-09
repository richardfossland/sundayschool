// ── Strum patterns → engine events (pure, no audio) ─────────────────────────
//
// Turns a chord track + a strum pattern into flat EngineEvents for the engine's
// guitar extraTrack. Per bar, each stroke of the pattern sounds the chord
// active at that beat (so a chord change mid-bar is respected stroke by
// stroke). Down-strokes sweep low→high with a ~0.015-beat stagger per string
// (a strum, not a block chord); up-strokes sweep the top strings high→low at a
// slightly lower velocity; accents get a velocity boost.
//
// Pitches come from the chord's best grip (`shapePitches`) — optionally a
// pre-resolved shape map from `shapesAtCapo` plus a `transpose` (= the capo)
// so what sounds matches the user's target key. Chords with no grip fall back
// to a compact pitch-class voicing around E2–E4.

import type { SongChord } from '@/types/song'
import type { EngineEvent } from '../engine-events'
import { chordPitchClasses, pitchClass } from '../music'
import { shapePitches, shapesFor, type Shape } from './chord-shapes'

export interface StrumStroke {
  /** Beat offset within the bar (0 = downbeat). */
  t: number
  dir: 'D' | 'U'
  accent?: boolean
}

export interface StrumPattern {
  id: string
  label: string
  timeSignature: string // the meter this pattern is written for ('4/4' | '3/4' | '6/8')
  strokes: StrumStroke[]
}

// Six patterns spanning the repertoire: hymns (helslag/ballade), folk strumming,
// waltz, 6/8 (t in QUARTER beats — a 6/8 bar is 3 beats per SongDoc convention)
// and gospel shuffle (offbeats on the triplet 2/3).
export const STRUM_PATTERNS: StrumPattern[] = [
  {
    id: 'helslag',
    label: 'Helslag',
    timeSignature: '4/4',
    strokes: [{ t: 0, dir: 'D', accent: true }],
  },
  {
    id: 'folk',
    label: 'Folk (D–DU–UDU)',
    timeSignature: '4/4',
    strokes: [
      { t: 0, dir: 'D', accent: true },
      { t: 1, dir: 'D' },
      { t: 1.5, dir: 'U' },
      { t: 2.5, dir: 'U' },
      { t: 3, dir: 'D' },
      { t: 3.5, dir: 'U' },
    ],
  },
  {
    id: 'ballade',
    label: 'Ballade',
    timeSignature: '4/4',
    strokes: [
      { t: 0, dir: 'D', accent: true },
      { t: 1.5, dir: 'D' },
      { t: 2, dir: 'U' },
      { t: 3, dir: 'U' },
    ],
  },
  {
    id: 'vals',
    label: 'Vals (3/4)',
    timeSignature: '3/4',
    strokes: [
      { t: 0, dir: 'D', accent: true },
      { t: 1, dir: 'D' },
      { t: 1.5, dir: 'U' },
      { t: 2, dir: 'D' },
      { t: 2.5, dir: 'U' },
    ],
  },
  {
    id: 'seks-atte',
    label: '6/8',
    timeSignature: '6/8',
    strokes: [
      { t: 0, dir: 'D', accent: true },
      { t: 0.5, dir: 'U' },
      { t: 1, dir: 'D' },
      { t: 1.5, dir: 'D', accent: true },
      { t: 2, dir: 'U' },
      { t: 2.5, dir: 'D' },
    ],
  },
  {
    id: 'gospel-shuffle',
    label: 'Gospel shuffle',
    timeSignature: '4/4',
    strokes: [
      { t: 0, dir: 'D', accent: true },
      { t: 2 / 3, dir: 'U' },
      { t: 1, dir: 'D' },
      { t: 1 + 2 / 3, dir: 'U' },
      { t: 2, dir: 'D', accent: true },
      { t: 2 + 2 / 3, dir: 'U' },
      { t: 3, dir: 'D' },
      { t: 3 + 2 / 3, dir: 'U' },
    ],
  },
]

export function patternById(id: string | null | undefined): StrumPattern | null {
  if (!id) return null
  return STRUM_PATTERNS.find((p) => p.id === id) ?? null
}

/** Quarter-note beats in one bar of `timeSignature` — the SongDoc convention
 * (6/8 → 3, 12/8 → 6, 6/4 → 6). NaN-safe: unparseable meters give 4. */
export function beatsPerBarOf(timeSignature: string): number {
  const [num, den] = timeSignature.split('/').map(Number)
  if (!Number.isFinite(num) || !Number.isFinite(den) || num <= 0 || den <= 0) return 4
  return (num * 4) / den
}

/** A plain one-down-stroke-per-beat pattern for a meter the library has no
 * written pattern for — a hymn strum, and above all one that COVERS the whole
 * bar. (Tiling the 4/4 folk pattern over a 6/4 bar left beats 5–6 silent.) */
function syntheticPatternFor(timeSignature: string): StrumPattern {
  const beats = Math.max(1, Math.round(beatsPerBarOf(timeSignature)))
  return {
    id: `helslag-${timeSignature.replace('/', '-')}`,
    label: `Helslag (${timeSignature})`,
    timeSignature,
    strokes: Array.from({ length: beats }, (_, i) => ({
      t: i,
      dir: 'D' as const,
      accent: i === 0,
    })),
  }
}

/** The natural default pattern for a song's time signature. Meters with no
 * written pattern get a synthesised one-stroke-per-beat bar rather than a
 * 4/4 pattern that would leave the tail of the bar unstrummed. */
export function defaultPatternFor(timeSignature: string): StrumPattern {
  const match = STRUM_PATTERNS.find((p) => p.timeSignature === timeSignature)
  if (match && timeSignature !== '4/4') return match
  if (!match && timeSignature !== '4/4') return syntheticPatternFor(timeSignature)
  return STRUM_PATTERNS.find((p) => p.id === 'folk') ?? STRUM_PATTERNS[0]
}

const EPS = 1e-6
/** Micro-offset per string within one stroke — the "sweep" of a strum. */
const STRING_STAGGER = 0.015
/** Up-strokes brush only the top strings, like a real right hand. */
const UP_STRINGS = 4
const DOWN_VEL = 0.75
const UP_VEL = 0.6
const ACCENT_BOOST = 1.25

/**
 * Fallback voicing when no grip exists (dim, aug, …): the chord's pitch
 * classes stacked compactly from the root, rooted in the guitar's low range
 * (E2..D#3), rising toward E4.
 */
export function voiceChord(rootPc: number, quality: string): number[] {
  const pcs = chordPitchClasses(rootPc, quality)
  const root = 40 + pitchClass(rootPc - 4) // lowest MIDI ≥ E2 (40) with this pc
  const out = [root]
  let prev = root
  for (const p of pcs.slice(1)) {
    const step = pitchClass(p - prev)
    prev += step === 0 ? 12 : step
    out.push(prev)
  }
  return out
}

/** Index of the chord sounding at beat `t`, or -1 (chords assumed time-sorted). */
function chordIndexAt(chords: SongChord[], t: number): number {
  let found = -1
  for (let i = 0; i < chords.length; i++) {
    const c = chords[i]
    if (c.t <= t + EPS && t < c.t + c.d - EPS) found = i
  }
  return found
}

export interface StrumOptions {
  /** Pickup (opptakt) in beats — the bar grid is anchored at `pickupBeats`. */
  pickupBeats?: number
  /** Pre-resolved grips keyed by chord INDEX (from shapesAtCapo). When absent,
   * each chord's best capo-0 grip is looked up on the fly. */
  shapes?: Map<number, Shape>
  /** Semitones added to SHAPE pitches (the capo) so grips sound in the target
   * key. Not applied to the pitch-class fallback voicing (already sounding). */
  transpose?: number
}

/**
 * Flatten a chord track into strummed EngineEvents. Per bar of `beatsPerBar`
 * (grid anchored at the pickup), each pattern stroke sounds the chord active at
 * its beat; beats with no chord are silent. Stroke duration is the gap to the
 * pattern's next stroke (wrapping to the next bar), slightly shortened.
 */
export function strumEvents(
  chords: SongChord[],
  pattern: StrumPattern,
  beatsPerBar: number,
  totalBeats: number,
  opts: StrumOptions = {},
): EngineEvent[] {
  if (beatsPerBar <= 0 || totalBeats <= 0 || pattern.strokes.length === 0) return []

  const strokes = [...pattern.strokes].sort((a, b) => a.t - b.t)
  // Gap to the next stroke; the last stroke wraps to the first of the next bar.
  const gaps = strokes.map((s, i) =>
    i + 1 < strokes.length ? strokes[i + 1].t - s.t : beatsPerBar - s.t + strokes[0].t,
  )
  const transpose = opts.transpose ?? 0
  const pickup = opts.pickupBeats ?? 0

  // Bar grid anchored at the pickup: full bars start at pickupBeats. A partial
  // lead-in bar covers [0, pickupBeats) by starting one bar-length early.
  const phase = ((pickup % beatsPerBar) + beatsPerBar) % beatsPerBar
  const firstBar = phase === 0 ? 0 : phase - beatsPerBar

  const events: EngineEvent[] = []
  for (let barStart = firstBar; barStart < totalBeats - EPS; barStart += beatsPerBar) {
    strokes.forEach((stroke, si) => {
      const t = barStart + stroke.t
      if (t < -EPS || t >= totalBeats - EPS) return
      const idx = chordIndexAt(chords, t)
      if (idx === -1) return
      const chord = chords[idx]

      const shape = opts.shapes ? opts.shapes.get(idx) : (shapesFor(chord.r, chord.q)[0] ?? null)
      const base = shape
        ? shapePitches(shape).map((p) => p + transpose)
        : voiceChord(chord.r, chord.q)

      let pitches = [...base].sort((a, b) => a - b) // down: low → high
      if (stroke.dir === 'U') pitches = pitches.slice(-UP_STRINGS).reverse() // up: high → low

      const durBeats = Math.max(0.2, gaps[si] * 0.9)
      const vel = Math.min(1, (stroke.dir === 'D' ? DOWN_VEL : UP_VEL) * (stroke.accent ? ACCENT_BOOST : 1))
      pitches.forEach((pitch, i) => {
        events.push({ beat: t + i * STRING_STAGGER, pitch, durBeats, vel, hand: 'R' })
      })
    })
  }
  return events
}
