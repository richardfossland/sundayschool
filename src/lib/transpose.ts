import type { SongDoc, SongNote, SongChord } from '@/types/song'
import { chordLabel, pitchClass } from './music'
import { keyNameForTonic, parseKeySignature } from './spelling'

/**
 * Semitone offset to move `originalKey` → `targetKey` by the NEAREST path,
 * so a song keeps its register instead of leaping up to +11. Range: −6..+6.
 */
export function nearestOffset(originalKey: number, targetKey: number): number {
  const off = (((targetKey - originalKey) % 12) + 12) % 12
  return off > 6 ? off - 12 : off
}

/** Transpose a single note by a semitone offset (absolute MIDI, no wrap). */
export function transposeNote(n: SongNote, offset: number): SongNote {
  return { ...n, p: n.p + offset }
}

/** Transpose a chord's root/bass by a semitone offset (kept as pitch classes). */
export function transposeChord(c: SongChord, offset: number): SongChord {
  return {
    ...c,
    r: pitchClass(c.r + offset),
    b: c.b === undefined ? undefined : pitchClass(c.b + offset),
  }
}

/**
 * Transpose a key-signature string by a semitone offset, keeping the mode and
 * choosing a pretty enharmonic name (via the spelling module). 'Eb' +7 → 'Bb'.
 */
export function transposeKeySignature(key: string, semitones: number): string {
  const { tonic, mode } = parseKeySignature(key)
  return keyNameForTonic(tonic + semitones, mode)
}

/**
 * Transpose a whole SongDoc by a semitone offset. Notes shift in absolute MIDI
 * (register preserved), chord roots/bass wrap as pitch classes, the key
 * signature is respelled; sections and timing are untouched. Pure — no mutation.
 */
export function transposeDoc(doc: SongDoc, semitones: number): SongDoc {
  if (semitones === 0) return doc
  return {
    ...doc,
    keySignature: transposeKeySignature(doc.keySignature, semitones),
    notes: doc.notes.map((n) => transposeNote(n, semitones)),
    chords: doc.chords.map((c) => transposeChord(c, semitones)),
  }
}

/** Display label for a chord (root/bass are pitch classes), spelling-agnostic. */
export function labelForChord(c: SongChord): string {
  return chordLabel(c.r, c.q, c.b)
}
