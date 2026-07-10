import { describe, it, expect } from 'vitest'
import { matchChord, type ChordLevel, type ChordMatch } from './chord-match'
import type { SongChord } from '@/types/song'

// The single densest test in the app: every level × quality × inversion corner
// of matchChord. Chords are pitch-class + quality (+ optional bass); grips are
// MIDI note sets. Helpers keep the tables terse.

const ch = (r: number, q = '', b?: number): SongChord =>
  b === undefined ? { t: 0, d: 4, r, q } : { t: 0, d: 4, r, q, b }
const held = (...m: number[]) => new Set(m)

// C4 = 60. Note constants used across the tables.
const C4 = 60, E4 = 64, G4 = 67, Bb4 = 70, B4 = 71
const C5 = 72, E5 = 76, G5 = 79
const E3 = 52, G3 = 55, C3 = 48, Bb3 = 58
const D4 = 62, F4 = 65, A4 = 69, A3 = 57, F3 = 53, D3 = 50

describe('matchChord — level 1 (grunnstilling)', () => {
  const cases: [string, Set<number>, SongChord, ChordMatch][] = [
    ['root + third is enough for a triad', held(C4, E4), ch(0), 'valid'],
    ['full root-position triad', held(C4, E4, G4), ch(0), 'valid'],
    ['root + third across octaves still root position', held(C4, E5), ch(0), 'valid'],
    ['missing the third is only partial', held(C4, G4), ch(0), 'partial'],
    ['empty grip is partial, never wrong', held(), ch(0), 'partial'],
    ['a seventh chord needs its seventh', held(C4, E4, G4), ch(0, '7'), 'partial'],
    ['seventh chord complete with the 7th', held(C4, E4, G4, Bb4), ch(0, '7'), 'valid'],
    ['an inversion is wrong at level 1 (bass ≠ root)', held(E3, G3, C4), ch(0), 'wrong'],
    ['a foreign tone is wrong', held(C4, E4, G4, B4), ch(0), 'wrong'],
    ['neighbour chord (G major) is wrong', held(G3, B4, D4), ch(0), 'wrong'],
    ['neighbour chord (D minor) is wrong', held(D4, F4, A4), ch(0), 'wrong'],
  ]
  for (const [name, h, chord, want] of cases) {
    it(name, () => expect(matchChord(h, chord, 1)).toBe(want))
  }
})

describe('matchChord — level 2 (inversjoner): every inversion + octave is accepted', () => {
  // All rotations/octaves of a C major triad — each must be valid at level 2.
  const voicings: [string, Set<number>][] = [
    ['root position', held(C4, E4, G4)],
    ['first inversion', held(E3, G3, C4)],
    ['second inversion', held(G3, C4, E4)],
    ['wide spread', held(C3, E4, G5)],
    ['up an octave', held(C5, E5, G5)],
    ['doubled root', held(C3, C4, E4, G4)],
  ]
  for (const [name, h] of voicings) {
    it(name, () => expect(matchChord(h, ch(0), 2)).toBe('valid'))
  }

  it('the same first inversion is wrong at level 1', () =>
    expect(matchChord(held(E3, G3, C4), ch(0), 1)).toBe('wrong'))

  it('a neighbour chord is still wrong at level 2', () =>
    expect(matchChord(held(D4, F4, A4), ch(0), 2)).toBe('wrong'))
})

describe('matchChord — slash chords', () => {
  const cSlashE = ch(0, '', 4) // C/E — E must be the bass
  it('correct slash bass is valid at level 2', () =>
    expect(matchChord(held(E3, G3, C4), cSlashE, 2)).toBe('valid'))
  it('root in the bass violates the slash requirement (wrong)', () =>
    expect(matchChord(held(C4, E4, G4), cSlashE, 2)).toBe('wrong'))
  it('second inversion (G bass) is wrong for C/E', () =>
    expect(matchChord(held(G3, C4, E4), cSlashE, 2)).toBe('wrong'))
})

describe('matchChord — sus and dim corner cases', () => {
  it('Csus4 needs the 4th, not a 3rd', () =>
    expect(matchChord(held(C4, F4, G4), ch(0, 'sus4'), 1)).toBe('valid'))
  it('a major 3rd in a sus4 chord is a foreign tone (wrong)', () =>
    expect(matchChord(held(C4, E4, G4), ch(0, 'sus4'), 1)).toBe('wrong'))
  it('Cdim is valid on its own tones', () =>
    expect(matchChord(held(C4, 63, 66), ch(0, 'dim'), 1)).toBe('valid')) // C Eb Gb
  it('a perfect 5th in a dim chord is foreign (wrong)', () =>
    expect(matchChord(held(C4, 63, G4), ch(0, 'dim'), 1)).toBe('wrong'))
})

describe('matchChord — level 3 (utvidelser): added colour tones tolerated', () => {
  it('a 9th added on top of a C triad is valid at level 3', () =>
    expect(matchChord(held(C4, E4, G4, D4 + 12), ch(0), 3)).toBe('valid'))
  it('the same added 9th is a foreign tone at level 2 (wrong)', () =>
    expect(matchChord(held(C4, E4, G4, D4 + 12), ch(0), 2)).toBe('wrong'))
  it('a 13th (A) added is tolerated at level 3', () =>
    expect(matchChord(held(C4, E4, G4, A4), ch(0), 3)).toBe('valid'))
  it('a leading tone (B) is still foreign even at level 3 (wrong)', () =>
    expect(matchChord(held(C4, E4, G4, B4), ch(0), 3)).toBe('wrong'))
})

describe('matchChord — level 4 (gospel / rootless)', () => {
  // Dm7 rootless A-voicing: F A C E (3-5-7-9), no D. Only valid at level 4.
  const dm7 = ch(2, 'm7')
  const rootlessA = held(F3, A3, C4, E4)
  const perLevel: [ChordLevel, ChordMatch][] = [
    [1, 'wrong'], // E (9th) is foreign at level 1
    [2, 'wrong'], // still foreign at level 2
    [3, 'partial'], // E now a tolerated extension, but the root is missing
    [4, 'valid'], // rootless: guide tones 3 (F) + 7 (C) present, root optional
  ]
  for (const [level, want] of perLevel) {
    it(`rootless 3-5-7-9 is ${want} at level ${level}`, () =>
      expect(matchChord(rootlessA, dm7, level)).toBe(want))
  }

  it('rootless dominant shell 3 + 7 (no root, no fifth) is valid at level 4', () =>
    // G7 = G B D F; shell = B (3) + F (7), root omitted.
    expect(matchChord(held(B4 - 12, F4), ch(7, '7'), 4)).toBe('valid'))

  it('a lone third is still incomplete at level 4 (partial)', () =>
    expect(matchChord(held(E4), ch(0), 4)).toBe('partial'))

  it('rootless triad needs 3 + 5 at level 4', () =>
    expect(matchChord(held(E4, G4), ch(0), 4)).toBe('valid'))

  it('a neighbour leading tone is still wrong at level 4', () =>
    expect(matchChord(held(E4, G4, B4), ch(0), 4)).toBe('wrong'))
})
