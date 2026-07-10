// ── Voicing hints (pure, no audio) ──────────────────────────────────────────
//
// Suggests a concrete MIDI voicing for a chord at a given besifring level, so
// the keyboard can dot the notes worth reaching for. A compact port of the ideas
// in SundayLicks' theory/voicings.ts, trimmed to the four SundaySchool levels:
//
//   1  Grunnstilling — close root-position triad/7th.
//   2  Inversjoner   — first inversion (third in the bass).
//   3  Utvidelser    — close voicing + a 9th on top for colour.
//   4  Gospel        — wide rootless spread: low root octave + guide tones + 9th.
//
// Everything is centred around C4 = 60 via the nearest-register root, matching
// the rest of the app. Pure — used only to paint hint dots, never to sound.

import type { SongChord } from '@/types/song'
import type { ChordLevel } from './chord-match'
import { nearestOffset } from './transpose'

interface Tones {
  third: number // semitone offset from root
  fifth: number | null
  seventh: number | null // 6ths occupy the seventh slot
}

const TONES: Record<string, Tones> = {
  '': { third: 4, fifth: 7, seventh: null },
  m: { third: 3, fifth: 7, seventh: null },
  '7': { third: 4, fifth: 7, seventh: 10 },
  maj7: { third: 4, fifth: 7, seventh: 11 },
  m7: { third: 3, fifth: 7, seventh: 10 },
  m7b5: { third: 3, fifth: 6, seventh: 10 },
  dim: { third: 3, fifth: 6, seventh: null },
  dim7: { third: 3, fifth: 6, seventh: 9 },
  sus4: { third: 5, fifth: 7, seventh: null },
  sus2: { third: 2, fifth: 7, seventh: null },
  '6': { third: 4, fifth: 7, seventh: 9 },
  m6: { third: 3, fifth: 7, seventh: 9 },
  '9': { third: 4, fifth: 7, seventh: 10 },
  m9: { third: 3, fifth: 7, seventh: 10 },
  maj9: { third: 4, fifth: 7, seventh: 11 },
  add9: { third: 4, fifth: 7, seventh: null },
  '7sus4': { third: 5, fifth: 7, seventh: 10 },
  '5': { third: 7, fifth: null, seventh: null },
  aug: { third: 4, fifth: 8, seventh: null },
}

const NINTH = 14 // major 9th above the root, generic colour tone

function tonesOf(quality: string): Tones {
  return TONES[quality] ?? TONES['']
}

/** MIDI pitch of `root`'s tonic in the register nearest C4 (60). */
function rootMidi(root: number): number {
  return 60 + nearestOffset(0, root)
}

function asc(pitches: number[]): number[] {
  return [...pitches].sort((a, b) => a - b)
}

/**
 * A suggested voicing (ascending MIDI pitches) for a chord at a besifring level.
 * Absolute pitch classes matter for the keyboard overlay; the register keeps the
 * hint near C4 so it lands on the visible keys.
 */
export function voicingHint(chord: SongChord, level: ChordLevel): number[] {
  const { third, fifth, seventh } = tonesOf(chord.q)
  const root = rootMidi(chord.r)
  const upper = seventh ?? fifth ?? 7

  switch (level) {
    case 1: {
      // Close root position.
      const offs = [0, third, ...(fifth !== null ? [fifth] : []), ...(seventh !== null ? [seventh] : [])]
      return asc(offs.map((o) => root + o))
    }
    case 2: {
      // First inversion: put the third in the bass, root/fifth above.
      const offs = [third, ...(fifth !== null ? [fifth] : []), 12, ...(seventh !== null ? [seventh] : [])]
      return asc(offs.map((o) => root + o))
    }
    case 3: {
      // Close voicing plus a 9th on top for colour.
      const offs = [0, third, ...(fifth !== null ? [fifth] : []), ...(seventh !== null ? [seventh] : []), NINTH]
      return asc(offs.map((o) => root + o))
    }
    case 4:
    default: {
      // Wide rootless-leaning gospel spread: low root octave, guide tones, 9th.
      return asc([root - 12, root + third, root + upper, root + NINTH])
    }
  }
}

/** Overlay descriptor for the keyboard: the root + the hint's pitch classes. */
export function voicingOverlay(chord: SongChord, level: ChordLevel): { root: number; tones: Set<number> } {
  const tones = new Set(voicingHint(chord, level).map((m) => ((m % 12) + 12) % 12))
  return { root: ((chord.r % 12) + 12) % 12, tones }
}
