// ── Bassline generator (pure, deterministic) ─────────────────────────────────
//
// Turns a song's chord track into a playable bass part at three levels:
//   1 Grunntoner   — the root, held for the whole chord duration.
//   2 Rot og kvint — root on heavy beats, fifth on light beats (meter-aware).
//   3 Vandrende    — walking bass: root on the chord's first beat, chord tones
//                    (third/fifth) in the middle, and a chromatic approach tone
//                    on the last beat leading into the NEXT chord's root.
// Slash chords (C/E) use the written bass note as the bass tone. Everything is
// derived from the (already transposed) SongDoc chords, so generation is a pure
// number transform — same output for the same input, no randomness.

import type { SongChord, SongDoc } from '@/types/song'
import type { EngineEvent } from '../engine-events'
// Eksplisitt .ts-endelse: fila er i seed-scriptets import-graf (Node
// type-stripping krever fulle stier — samme krav som i src/data/songs/).
import { pitchClass } from '../music.ts'

export type BassLevel = 1 | 2 | 3

/** Playable electric-bass range (matches the sampled E1–G3 span). */
export const BASS_LOW = 28 // E1
export const BASS_HIGH = 55 // G3

/** Register anchor: roots are voiced in the octave nearest A1 (33) — the meat
 * of the instrument, comfortably above the low E and far from the range top. */
const ANCHOR = 33

const VEL = 0.85
const EPS = 1e-6

/** The pitch of pitch-class `pc` in the octave nearest `near`, clamped into the
 * playable range. Deterministic: on an exact tie the LOWER octave wins. */
export function nearestPitch(pc: number, near: number = ANCHOR): number {
  const cls = pitchClass(pc)
  let best = -1
  let bestDist = Infinity
  for (let p = cls; p <= 127; p += 12) {
    if (p < BASS_LOW || p > BASS_HIGH) continue
    const d = Math.abs(p - near)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  // Every pitch class has at least two candidates inside a 27-semitone range.
  return best
}

/** Clamp a pitch into the bass range by octave folding (pure). */
function intoRange(p: number): number {
  let x = p
  while (x > BASS_HIGH) x -= 12
  while (x < BASS_LOW) x += 12
  return x
}

/** The chord's bass tone (slash bass when written, else the root) voiced near
 * the register anchor. */
export function chordBassPitch(c: SongChord): number {
  return nearestPitch(c.b ?? c.r)
}

/** Semitone interval of the chord's third above the root (minor for m/dim). */
function thirdInterval(q: string): number {
  return q.startsWith('m') && !q.startsWith('maj') ? 3 : q.startsWith('dim') ? 3 : 4
}

/** Semitone interval of the chord's fifth above the root (dim ♭5, aug ♯5). */
function fifthInterval(q: string): number {
  if (q.startsWith('dim') || q === 'm7b5') return 6
  if (q === 'aug') return 8
  return 7
}

/** Is `beat` a heavy beat of the bar? Beat 1 always; in even meters (4/4) also
 * the mid-bar beat (beat 3 of 4). 3/4 and 6/8 (beatsPerBar 3) → only beat 1. */
export function isHeavyBeat(beat: number, beatsPerBar: number, pickupBeats: number): boolean {
  if (beatsPerBar <= 0) return true
  const rel = beat - pickupBeats
  const inBar = ((rel % beatsPerBar) + beatsPerBar) % beatsPerBar
  const near = (v: number) => Math.abs(inBar - v) < 1e-3
  if (near(0) || near(beatsPerBar)) return true
  return beatsPerBar % 2 === 0 && near(beatsPerBar / 2)
}

/** Whole-beat grid positions inside a chord's span [t, t+d). Chords in this
 * library start on whole beats; a fractional tail simply extends the last note. */
function beatGrid(c: SongChord): number[] {
  const out: number[] = []
  for (let b = 0; b < c.d - EPS; b += 1) out.push(c.t + b)
  return out.length > 0 ? out : [c.t]
}

/** Chromatic approach tone into `target`: one semitone below when playable,
 * otherwise one above. Always lands ±1 from the target — the classic walking
 * resolution — and always inside the bass range. */
function approachTone(target: number): number {
  const below = target - 1
  if (below >= BASS_LOW) return below
  return target + 1
}

/**
 * Generate the bass part for a chord track. `doc` supplies the meter
 * (beatsPerBar / pickupBeats); `chords` are the (transposed) chord events.
 * Returns flat EngineEvents ready for engine extraTracks. Pure + deterministic.
 */
export function generateBassline(
  chords: SongChord[],
  doc: Pick<SongDoc, 'beatsPerBar' | 'pickupBeats'>,
  level: BassLevel,
): EngineEvent[] {
  const sorted = [...chords].sort((a, b) => a.t - b.t)
  const events: EngineEvent[] = []
  const push = (beat: number, pitch: number, durBeats: number) =>
    events.push({ beat, pitch: intoRange(pitch), durBeats, vel: VEL, hand: 'L' })

  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i]
    const root = chordBassPitch(c)

    if (level === 1) {
      // One held root per chord.
      push(c.t, root, c.d)
      continue
    }

    const grid = beatGrid(c)
    const chordEnd = c.t + c.d
    // Duration of the note starting at grid[j]: up to the next grid point, and
    // the last one absorbs any fractional tail of the chord.
    const durAt = (j: number) => (j < grid.length - 1 ? grid[j + 1] - grid[j] : chordEnd - grid[j])

    if (level === 2) {
      // Root on heavy beats, fifth on light beats. The fifth is voiced from the
      // root and folded into range (so it may sound a fourth below).
      const fifth = root + fifthInterval(c.q)
      for (let j = 0; j < grid.length; j++) {
        const heavy = isHeavyBeat(grid[j], doc.beatsPerBar, doc.pickupBeats)
        push(grid[j], heavy ? root : fifth, durAt(j))
      }
      continue
    }

    // Level 3 — walking. Root first; chord tones (third, fifth, alternating) in
    // the middle; approach tone into the next chord's root on the last beat.
    const next = i + 1 < sorted.length ? sorted[i + 1] : null
    const third = root + thirdInterval(c.q)
    const fifth = root + fifthInterval(c.q)
    for (let j = 0; j < grid.length; j++) {
      const last = j === grid.length - 1
      let pitch: number
      if (j === 0) {
        pitch = root
      } else if (last && next) {
        pitch = approachTone(chordBassPitch(next))
      } else if (last) {
        // Final chord of the song: close on the fifth (or stay on the root).
        pitch = grid.length > 1 ? fifth : root
      } else {
        // Middle beats alternate third / fifth, starting with the third.
        pitch = j % 2 === 1 ? third : fifth
      }
      push(grid[j], pitch, durAt(j))
    }
  }
  return events
}
