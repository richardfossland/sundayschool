// ── Section / timeline helpers (pure) ───────────────────────────────────────
//
// SongDoc sections tile [0, totalBeats] without gaps (see docInvariants). These
// helpers drive SectionNav, per-section looping and bar numbering. Bars respect
// the pickup (opptakt): pickup notes are "bar 0", the first full bar is bar 1.

import type { SongDoc, SongSection, SongNote, SongChord } from '@/types/song'

const EPS = 1e-6

/** The section containing `beat` (startBeat ≤ beat < endBeat), or null. */
export function sectionOf(doc: SongDoc, beat: number): SongSection | null {
  for (const s of doc.sections) {
    if (beat >= s.startBeat - EPS && beat < s.endBeat - EPS) return s
  }
  return null
}

/** Notes that START within [startBeat, endBeat) (onset in the interval). */
export function notesInRange(doc: SongDoc, startBeat: number, endBeat: number): SongNote[] {
  return doc.notes.filter((n) => n.t >= startBeat - EPS && n.t < endBeat - EPS)
}

/** Chords that START within [startBeat, endBeat). */
export function chordsInRange(doc: SongDoc, startBeat: number, endBeat: number): SongChord[] {
  return doc.chords.filter((c) => c.t >= startBeat - EPS && c.t < endBeat - EPS)
}

/** Loop range [start, end] for a section. */
export function sectionLoopRange(section: SongSection): [number, number] {
  return [section.startBeat, section.endBeat]
}

/**
 * 1-indexed bar number of `beat`, respecting the pickup. Pickup beats
 * (0 ≤ beat < pickupBeats) are "bar 0"; the first full bar (starting at
 * pickupBeats) is bar 1. With no pickup, beat 0 is bar 1.
 */
export function barOfBeat(doc: SongDoc, beat: number): number {
  if (beat < doc.pickupBeats - EPS) return 0
  const rel = beat - doc.pickupBeats
  return 1 + Math.floor(rel / doc.beatsPerBar + EPS)
}
