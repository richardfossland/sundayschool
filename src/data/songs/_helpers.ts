import type { Hand, SongChord, SongNote } from '@/types/song'

// ── Tiny authoring helpers for hand-arranged seed songs ──────────────────────
// Songs are authored as note lists; these helpers only remove the two most
// error-prone parts of manual entry: cumulative timing for a melodic line and
// repetitive object literals. No "auto-arranging" happens here — every pitch
// and duration is written by hand in the song files.

/** Rest marker inside a `line(...)` sequence. */
export const R = 0

/**
 * A monophonic line entered as [pitch, duration] pairs; time accumulates from
 * `startBeat`. Pitch 0 (R) is a rest — it advances time without emitting a
 * note. This keeps hand-entered melodies aligned even across long phrases.
 */
export function line(hand: Hand, startBeat: number, steps: [number, number][]): SongNote[] {
  const out: SongNote[] = []
  let t = startBeat
  for (const [p, d] of steps) {
    if (p !== R) out.push({ p, t, d, h: hand })
    t += d
  }
  return out
}

/** One chord voiced as simultaneous notes (used for LH root+fifth etc.). */
export function stack(hand: Hand, t: number, d: number, pitches: number[]): SongNote[] {
  return pitches.map((p) => ({ p, t, d, h: hand }))
}

/** Chord-symbol shorthand. */
export function ch(t: number, d: number, r: number, q = '', b?: number): SongChord {
  return b === undefined ? { t, d, r, q } : { t, d, r, q, b }
}

/** Concatenate note groups and return them sorted by onset (stable order). */
export function song(...groups: SongNote[][]): SongNote[] {
  return groups.flat().sort((a, b) => a.t - b.t || (a.h === b.h ? a.p - b.p : a.h === 'L' ? -1 : 1))
}
