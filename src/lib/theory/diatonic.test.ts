import { describe, expect, it } from 'vitest'
import {
  chordDegree,
  chordPitches,
  diatonicTriads,
  scalePitches,
  QUALITY_LABELS,
  VOICED_QUALITIES,
} from './diatonic'

describe('scalePitches', () => {
  it('builds C major from whole/half steps', () => {
    expect(scalePitches(0, 'major')).toEqual([0, 2, 4, 5, 7, 9, 11])
  })

  it('builds A natural minor', () => {
    expect(scalePitches(9, 'minor')).toEqual([9, 11, 0, 2, 4, 5, 7])
  })

  it('transposes: Eb major', () => {
    // Eb F G Ab Bb C D
    expect(scalePitches(3, 'major')).toEqual([3, 5, 7, 8, 10, 0, 2])
  })
})

describe('diatonicTriads — major', () => {
  const triads = diatonicTriads(0, 'major') // C major

  it('uses the I ii iii IV V vi vii° function symbols', () => {
    expect(triads.map((t) => t.roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
  })

  it('has the right roots and qualities in C', () => {
    expect(triads.map((t) => [t.root, t.quality])).toEqual([
      [0, ''], [2, 'm'], [4, 'm'], [5, ''], [7, ''], [9, 'm'], [11, 'dim'],
    ])
  })
})

describe('diatonicTriads — minor', () => {
  const triads = diatonicTriads(9, 'minor') // a minor

  it('uses the i ii° III iv v VI VII function symbols', () => {
    expect(triads.map((t) => t.roman)).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'])
  })

  it('has the right roots and qualities in a-moll', () => {
    expect(triads.map((t) => [t.root, t.quality])).toEqual([
      [9, 'm'], [11, 'dim'], [0, ''], [2, 'm'], [4, 'm'], [5, ''], [7, ''],
    ])
  })
})

describe('chordDegree', () => {
  const cMajor = { tonic: 0, mode: 'major' as const }

  it('finds a plain triad', () => {
    expect(chordDegree({ root: 7, quality: '' }, cMajor)?.roman).toBe('V')
    expect(chordDegree({ root: 9, quality: 'm' }, cMajor)?.roman).toBe('vi')
  })

  it('matches extended chords by triad family', () => {
    expect(chordDegree({ root: 7, quality: '7' }, cMajor)?.roman).toBe('V')
    expect(chordDegree({ root: 2, quality: 'm7' }, cMajor)?.roman).toBe('ii')
    expect(chordDegree({ root: 0, quality: 'maj7' }, cMajor)?.roman).toBe('I')
    expect(chordDegree({ root: 11, quality: 'm7b5' }, cMajor)?.roman).toBe('vii°')
  })

  it('returns null for non-diatonic chords', () => {
    expect(chordDegree({ root: 8, quality: '' }, cMajor)).toBeNull() // Ab in C
    expect(chordDegree({ root: 0, quality: 'm' }, cMajor)).toBeNull() // Cm in C
  })

  it('works in minor (natural)', () => {
    const aMinor = { tonic: 9, mode: 'minor' as const }
    expect(chordDegree({ root: 4, quality: 'm' }, aMinor)?.roman).toBe('v')
    expect(chordDegree({ root: 7, quality: '' }, aMinor)?.roman).toBe('VII')
  })
})

describe('chordPitches', () => {
  it('voices the taught qualities from a root MIDI note', () => {
    expect(chordPitches(60, '')).toEqual([60, 64, 67])
    expect(chordPitches(60, 'm')).toEqual([60, 63, 67])
    expect(chordPitches(60, '7')).toEqual([60, 64, 67, 70])
    expect(chordPitches(60, 'dim')).toEqual([60, 63, 66])
    expect(chordPitches(60, 'sus4')).toEqual([60, 65, 67])
  })

  it('voices the add9 ninth an octave up', () => {
    expect(chordPitches(60, 'add9')).toEqual([60, 64, 67, 74])
  })

  it('every voiced quality has a Norwegian label', () => {
    for (const q of VOICED_QUALITIES) expect(QUALITY_LABELS[q]).toBeTruthy()
  })
})
