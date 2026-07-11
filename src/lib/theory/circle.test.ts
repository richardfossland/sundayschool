import { describe, expect, it } from 'vitest'
import { keyAccidentals } from '../spelling'
import {
  accidentalLabel,
  angleForIndex,
  circleEntries,
  circleIndex,
  CIRCLE_OF_FIFTHS,
  neighbors,
  pointOnCircle,
  relativeMajor,
  relativeMinor,
} from './circle'

describe('CIRCLE_OF_FIFTHS order', () => {
  it('starts at C and rises a fifth per step', () => {
    expect(CIRCLE_OF_FIFTHS[0]).toBe(0)
    for (let i = 1; i < 12; i++) {
      expect(CIRCLE_OF_FIFTHS[i]).toBe((CIRCLE_OF_FIFTHS[i - 1] + 7) % 12)
    }
  })

  it('covers all 12 pitch classes', () => {
    expect(new Set(CIRCLE_OF_FIFTHS).size).toBe(12)
  })
})

describe('circleEntries', () => {
  const entries = circleEntries()

  it('has 12 entries in circle order', () => {
    expect(entries).toHaveLength(12)
    expect(entries.map((e) => e.pc)).toEqual([...CIRCLE_OF_FIFTHS])
  })

  it('accidental counts agree with spelling.ts keyAccidentals for every key', () => {
    for (const e of entries) {
      expect(e.accidentals).toEqual(keyAccidentals(e.major))
    }
  })

  it('sharps grow clockwise, flats counterclockwise', () => {
    const byPc = Object.fromEntries(entries.map((e) => [e.pc, e]))
    expect(byPc[0].accidentals).toEqual({ count: 0, type: null }) // C
    expect(byPc[7].accidentals).toEqual({ count: 1, type: '#' }) // G
    expect(byPc[2].accidentals).toEqual({ count: 2, type: '#' }) // D
    expect(byPc[5].accidentals).toEqual({ count: 1, type: 'b' }) // F
    expect(byPc[10].accidentals).toEqual({ count: 2, type: 'b' }) // Bb
    expect(byPc[3].accidentals).toEqual({ count: 3, type: 'b' }) // Eb
  })

  it('pairs each major key with its relative minor', () => {
    const c = circleEntries().find((e) => e.pc === 0)!
    expect(c.minorPc).toBe(9)
    expect(c.minor).toBe('a')
    const eb = circleEntries().find((e) => e.pc === 3)!
    expect(eb.minorPc).toBe(0)
    expect(eb.minor).toBe('c')
  })

  it('the relative minor shares the major key signature (spelling.ts parity)', () => {
    for (const e of circleEntries()) {
      expect(keyAccidentals(e.minor)).toEqual(e.accidentals)
    }
  })
})

describe('relative keys', () => {
  it('relativeMinor/relativeMajor are inverses', () => {
    for (let pc = 0; pc < 12; pc++) {
      expect(relativeMajor(relativeMinor(pc))).toBe(pc)
    }
  })
})

describe('neighbors', () => {
  it('returns dominant (clockwise) and subdominant (counterclockwise)', () => {
    expect(neighbors(0)).toEqual({ dominant: 7, subdominant: 5 }) // C → G, F
    expect(neighbors(3)).toEqual({ dominant: 10, subdominant: 8 }) // Eb → Bb, Ab
  })

  it('neighbors sit one index away on the circle', () => {
    for (let pc = 0; pc < 12; pc++) {
      const i = circleIndex(pc)
      const n = neighbors(pc)
      expect(circleIndex(n.dominant)).toBe((i + 1) % 12)
      expect(circleIndex(n.subdominant)).toBe((i + 11) % 12)
    }
  })
})

describe('accidentalLabel', () => {
  it('formats counts with the accidental glyph', () => {
    expect(accidentalLabel({ count: 0, type: null })).toBe('ingen fortegn')
    expect(accidentalLabel({ count: 3, type: 'b' })).toBe('3♭')
    expect(accidentalLabel({ count: 2, type: '#' })).toBe('2♯')
  })
})

describe('SVG geometry — hydration safety', () => {
  it('angleForIndex spaces 12 positions 30° apart', () => {
    expect(angleForIndex(0)).toBe(0)
    expect(angleForIndex(3)).toBe(90)
    expect(angleForIndex(6)).toBe(180)
  })

  it('pointOnCircle rounds to 3 decimals (server/browser emit identical strings)', () => {
    for (let i = 0; i < 12; i++) {
      const p = pointOnCircle(150, 150, 112, angleForIndex(i))
      expect(p.x).toBe(Math.round(p.x * 1000) / 1000)
      expect(p.y).toBe(Math.round(p.y * 1000) / 1000)
      // No excess float digits when stringified (the actual hydration hazard).
      expect(String(p.x).length).toBeLessThanOrEqual(8)
      expect(String(p.y).length).toBeLessThanOrEqual(8)
    }
  })

  it('puts index 0 at 12 o’clock and index 3 at 3 o’clock', () => {
    expect(pointOnCircle(150, 150, 100, 0)).toEqual({ x: 150, y: 50 })
    expect(pointOnCircle(150, 150, 100, 90)).toEqual({ x: 250, y: 150 })
  })
})
