import type { DrumHit } from '@/lib/drums/types'

// ── Tiny authoring helpers for hand-written grooves ──────────────────────────
// Same philosophy as data/songs/_helpers.ts: no auto-generation, every hit is
// written by hand — these only remove repetitive object literals.

// GM percussion pitches (canonical — must exist in INSTRUMENTS.drums).
export const K = 36 // kick
export const S = 38 // snare
export const HH = 42 // closed hi-hat
export const OH = 46 // open hi-hat
export const TL = 41 // low (floor) tom
export const TM = 45 // mid tom
export const TH = 48 // high tom
export const CR = 49 // crash
export const RD = 51 // ride

/** One hit. */
export function h(t: number, p: number, v = 0.8): DrumHit {
  return { t, p, v }
}

/** The same piece struck at several times, all at one velocity. */
export function at(p: number, v: number, times: number[]): DrumHit[] {
  return times.map((t) => ({ t, p, v }))
}

/** An evenly-spaced pulse (e.g. hi-hat eighths): from `start`, `count` hits
 * `step` beats apart. `accentEvery` (in hits) bumps every n-th hit to `accentV`. */
export function pulse(
  p: number,
  start: number,
  step: number,
  count: number,
  v: number,
  accentEvery = 0,
  accentV = v,
): DrumHit[] {
  return Array.from({ length: count }, (_, i) => ({
    t: start + i * step,
    p,
    v: accentEvery > 0 && i % accentEvery === 0 ? accentV : v,
  }))
}

/** Concatenate hit groups sorted by time (then pitch) — stable to author with. */
export function groove(...groups: DrumHit[][]): DrumHit[] {
  return groups.flat().sort((a, b) => a.t - b.t || a.p - b.p)
}
