import { describe, it, expect } from 'vitest'
import {
  keyAccidentals,
  spellPitch,
  spellPitchClass,
  chordSymbol,
  keyNameForTonic,
  vexKey,
  CHORD_DEGREES,
  type ChordContext,
} from './spelling'
import { CHORD_INTERVALS, chordPitchClasses } from './music'

// Every tone of a chord, spelled in a key, as plain names: 'C E G#'.
function chordTones(r: number, q: string, key: string): string {
  const ctx: ChordContext = { r, q }
  return chordPitchClasses(r, q)
    .map((pc) => {
      const s = spellPitchClass(pc, key, ctx)
      return s.letter + s.accidental
    })
    .join(' ')
}

describe('keyAccidentals — all 12 major keys', () => {
  const cases: [string, number, '#' | 'b' | null][] = [
    ['C', 0, null],
    ['Db', 5, 'b'],
    ['D', 2, '#'],
    ['Eb', 3, 'b'],
    ['E', 4, '#'],
    ['F', 1, 'b'],
    ['Gb', 6, 'b'],
    ['G', 1, '#'],
    ['Ab', 4, 'b'],
    ['A', 3, '#'],
    ['Bb', 2, 'b'],
    ['B', 5, '#'],
  ]
  it.each(cases)('%s → %i %s', (key, count, type) => {
    expect(keyAccidentals(key)).toEqual({ count, type })
  })

  it('handles the sharp-side extremes', () => {
    expect(keyAccidentals('F#')).toEqual({ count: 6, type: '#' })
    expect(keyAccidentals('C#')).toEqual({ count: 7, type: '#' })
  })
})

describe('keyAccidentals — minor keys (lowercase)', () => {
  it('a minor has no accidentals', () => {
    expect(keyAccidentals('a')).toEqual({ count: 0, type: null })
  })
  it('g minor has 2 flats', () => {
    expect(keyAccidentals('g')).toEqual({ count: 2, type: 'b' })
  })
  it('f# minor has 3 sharps', () => {
    expect(keyAccidentals('f#')).toEqual({ count: 3, type: '#' })
  })
})

describe('spellPitch — diatonic spelling follows the key', () => {
  it('Eb major: MIDI 68 is Ab, not G#', () => {
    expect(spellPitch(68, 'Eb')).toEqual({ letter: 'A', accidental: 'b', octave: 4 })
  })
  it('Eb major: MIDI 63 is Eb', () => {
    expect(spellPitch(63, 'Eb')).toEqual({ letter: 'E', accidental: 'b', octave: 4 })
  })
  it('G major: MIDI 66 is F#', () => {
    expect(spellPitch(66, 'G')).toEqual({ letter: 'F', accidental: '#', octave: 4 })
  })
  it('C major: chromatic MIDI 66 is F#, MIDI 70 is Bb', () => {
    expect(spellPitchClass(6, 'C')).toEqual({ letter: 'F', accidental: '#' })
    expect(spellPitchClass(10, 'C')).toEqual({ letter: 'B', accidental: 'b' })
  })
})

describe('spellPitch — minor leading tone spelled with a sharp side', () => {
  it('g minor: raised 7th is F#', () => {
    expect(spellPitchClass(6, 'g')).toEqual({ letter: 'F', accidental: '#' })
  })
  it('c minor: raised 7th is B natural', () => {
    expect(spellPitchClass(11, 'c')).toEqual({ letter: 'B', accidental: '' })
  })
})

describe('spellPitch — octave stays on the letter (B#/Cb boundary)', () => {
  it('Cb major keeps Cb on octave 4 (sounds B3)', () => {
    expect(spellPitch(59, 'Cb')).toEqual({ letter: 'C', accidental: 'b', octave: 4 })
  })
})

describe('chordSymbol — key-correct enharmonics', () => {
  it('Eb: pitch class 8 renders Ab, never G#', () => {
    expect(chordSymbol(8, '', 'Eb')).toBe('Ab')
    expect(chordSymbol(8, 'm7', 'Eb')).toBe('Abm7')
  })
  it('slash chord uses key spelling for the bass', () => {
    expect(chordSymbol(3, '', 'Eb', 0)).toBe('Eb/C')
  })
})

describe('chord context — the four spellings the key signature alone gets wrong', () => {
  // Fasit from the 2026-08-09 review (S2): every one of these is an altered
  // chord tone, and the key's own chromatic table has no way to see it.
  it('F major: the third of D7 is f#, not gb', () => {
    expect(chordTones(2, '7', 'F')).toBe('D F# A C')
    expect(vexKey(66, 'F')).toBe('gb/4') // key alone
    expect(vexKey(66, 'F', { r: 2, q: '7' })).toBe('f#/4') // under the chord
  })
  it('Eb major: Caug is C E G#, not C E Ab', () => {
    expect(chordTones(0, 'aug', 'Eb')).toBe('C E G#')
  })
  it('Eb major: Cdim is C Eb Gb, not C D# F#', () => {
    expect(chordTones(0, 'dim', 'Eb')).toBe('C Eb Gb')
  })
  it('B major: the third of C#7 is e#, not f', () => {
    expect(chordTones(1, '7', 'B')).toBe('C# E# G# B')
    expect(vexKey(65, 'B')).toBe('f/4')
    expect(vexKey(65, 'B', { r: 1, q: '7' })).toBe('e#/4')
  })
})

describe('chord context — tones outside the chord still follow the key', () => {
  it('F major under D7: bb stays bb, and every diatonic tone is untouched', () => {
    const d7: ChordContext = { r: 2, q: '7' }
    expect(spellPitchClass(10, 'F', d7)).toEqual({ letter: 'B', accidental: 'b' })
    for (const pc of [5, 7, 9, 10, 0, 2, 4]) {
      expect(spellPitchClass(pc, 'F', d7)).toEqual(spellPitchClass(pc, 'F'))
    }
  })
  it('the context is optional — omitting it is the old key-only behaviour', () => {
    expect(vexKey(66, 'F', null)).toBe(vexKey(66, 'F'))
    expect(vexKey(66, 'F', undefined)).toBe('gb/4')
  })
})

describe('chord context — the root letter is chosen, not assumed', () => {
  it('C major: a bVI triad is Ab C Eb, never G# B# D#', () => {
    // The key's chromatic table spells pitch class 8 as g#; spelling the chord
    // from there would turn its own diatonic C and Eb into b# and d#.
    expect(spellPitchClass(8, 'C')).toEqual({ letter: 'G', accidental: '#' })
    expect(chordTones(8, '', 'C')).toBe('Ab C Eb')
  })
  it('Gb major: the IV chord prints nothing, so it stays Cb Eb Gb', () => {
    expect(chordTones(11, '', 'Gb')).toBe('Cb Eb Gb')
  })
  it('Bb major: a diminished chord on pitch class 6 is F# A C, not Gb Bbb Dbb', () => {
    expect(chordTones(6, 'dim', 'Bb')).toBe('F# A C')
  })
  it('a chord symbol never names a double accidental', () => {
    // In B major the passing diminished chord on pitch class 7 resolves up to
    // g# minor, so theory wants F##dim. No chord strip should read that: the
    // root pays for its double accidental and the chord respells as Gdim.
    expect(chordSymbol(7, 'dim', 'B')).toBe('Gdim')
    expect(chordTones(7, 'dim', 'B')).toBe('G Bb Db')
  })
})

describe('chord context — double accidentals on noteheads are kept and renderable', () => {
  it('D major: VI+ is B D# F##, the ordinary spelling of an augmented triad', () => {
    expect(chordTones(11, 'aug', 'D')).toBe('B D# F##')
    expect(vexKey(79, 'D', { r: 11, q: 'aug' })).toBe('f##/5') // MIDI 79 sounds G5
  })
  it('a diminished seventh stacks all the way to a double flat', () => {
    expect(chordTones(0, 'dim7', 'Eb')).toBe('C Eb Gb Bbb')
    expect(vexKey(69, 'Eb', { r: 0, q: 'dim7' })).toBe('bbb/4')
  })
  it('the octave follows the LETTER, so b## stays on the B line below it', () => {
    // F# major, E#+ = E# G## B##. B##4 sounds C#5 but is written on the B line
    // of octave 4 — the same rule that keeps Cb4 off octave 3.
    expect(chordTones(5, 'aug', 'F#')).toBe('E# G## B##')
    expect(spellPitch(73, 'F#', { r: 5, q: 'aug' })).toEqual({ letter: 'B', accidental: '##', octave: 4 })
    expect(vexKey(73, 'F#', { r: 5, q: 'aug' })).toBe('b##/4')
  })
})

describe('chord context — the minor leading tone still wins where they coincide', () => {
  it('g minor: the third of D7 is f#, from both rules', () => {
    expect(spellPitchClass(6, 'g')).toEqual({ letter: 'F', accidental: '#' })
    expect(chordTones(2, '7', 'g')).toBe('D F# A C')
  })
  it('g# minor: the dominant keeps the f## leading tone rather than flipping to Eb7', () => {
    expect(spellPitchClass(7, 'g#')).toEqual({ letter: 'F', accidental: '##' })
    expect(chordTones(3, '7', 'g#')).toBe('D# F## A# C#')
  })
})

describe('chord context — degree table is pinned to the interval table', () => {
  it('every quality has a degree for every one of its intervals', () => {
    expect(Object.keys(CHORD_DEGREES).sort()).toEqual(Object.keys(CHORD_INTERVALS).sort())
    for (const q of Object.keys(CHORD_INTERVALS)) {
      expect(`${q}: ${CHORD_DEGREES[q].length}`).toBe(`${q}: ${CHORD_INTERVALS[q].length}`)
      expect(CHORD_DEGREES[q][0]).toBe(0) // the first interval is always the root
    }
  })
  it('an unknown quality falls back to the triad instead of throwing', () => {
    expect(chordTones(0, 'm11b13', 'C')).toBe('C E G')
  })
})

describe('chordSymbol — the chord is its own context', () => {
  it('a slash bass that is a chord tone is spelled from the stack', () => {
    expect(chordSymbol(1, '7', 'B', 5)).toBe('C#7/E#')
  })
  it('a bass outside the chord still follows the key', () => {
    expect(chordSymbol(3, '', 'Eb', 0)).toBe('Eb/C')
    expect(chordSymbol(2, '7', 'F', 10)).toBe('D7/Bb')
  })
})

describe('keyNameForTonic', () => {
  it('major and minor names', () => {
    expect(keyNameForTonic(10, 'major')).toBe('Bb')
    expect(keyNameForTonic(7, 'minor')).toBe('g')
  })
})
