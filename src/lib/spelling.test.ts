import { describe, it, expect } from 'vitest'
import {
  keyAccidentals,
  spellPitch,
  spellPitchClass,
  chordSymbol,
  keyNameForTonic,
} from './spelling'

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

describe('keyNameForTonic', () => {
  it('major and minor names', () => {
    expect(keyNameForTonic(10, 'major')).toBe('Bb')
    expect(keyNameForTonic(7, 'minor')).toBe('g')
  })
})
