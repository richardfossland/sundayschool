import { describe, it, expect } from 'vitest'
import {
  BASS_EADG,
  GUITAR_STANDARD,
  bestPosition,
  fretboardLayout,
} from './fretboard-geometry'

describe('fretboardLayout — bass EADG, 12 frets, 600×160', () => {
  const layout = fretboardLayout(BASS_EADG, 12, 600, 160)

  it('has one y per string and fretCount+1 fret lines', () => {
    expect(layout.stringY).toHaveLength(4)
    expect(layout.fretX).toHaveLength(13)
  })

  it('puts the LOW string (index 0) at the BOTTOM (largest y)', () => {
    for (let i = 1; i < layout.stringY.length; i++) {
      expect(layout.stringY[i]).toBeLessThan(layout.stringY[i - 1])
    }
    expect(layout.stringY[0]).toBeGreaterThan(layout.stringY[3])
  })

  it('spaces frets linearly from 0 to the full width', () => {
    expect(layout.fretX[0]).toBe(0)
    expect(layout.fretX[12]).toBe(600)
    const step = layout.fretX[1] - layout.fretX[0]
    for (let f = 1; f <= 12; f++) {
      expect(layout.fretX[f] - layout.fretX[f - 1]).toBeCloseTo(step)
    }
  })

  it('keeps strings inside the box with a vertical inset', () => {
    for (const y of layout.stringY) {
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(160)
    }
  })

  it('posOf: open note sits on the nut, fretted note between its fret lines', () => {
    const open = layout.posOf(0, 0)
    expect(open.x).toBe(0)
    expect(open.y).toBeCloseTo(layout.stringY[0])

    const fret3 = layout.posOf(1, 3)
    expect(fret3.x).toBeGreaterThan(layout.fretX[2])
    expect(fret3.x).toBeLessThan(layout.fretX[3])
    expect(fret3.x).toBeCloseTo((layout.fretX[2] + layout.fretX[3]) / 2)
    expect(fret3.y).toBeCloseTo(layout.stringY[1])
  })

  it('posOf clamps out-of-range string/fret instead of throwing', () => {
    expect(() => layout.posOf(99, 99)).not.toThrow()
    const p = layout.posOf(99, 99)
    expect(p.y).toBeCloseTo(layout.stringY[3])
    expect(p.x).toBeLessThanOrEqual(600)
  })
})

describe('bestPosition — bass EADG', () => {
  it('plays E1 (28) as the open low E string', () => {
    expect(bestPosition(28, BASS_EADG)).toEqual({ string: 0, fret: 0 })
  })

  it('prefers the low home band with no history (D2 → open D, not E-string fret 10)', () => {
    expect(bestPosition(38, BASS_EADG)).toEqual({ string: 2, fret: 0 })
  })

  it('G3 (55) has several positions and picks the one nearest prev', () => {
    // With no history: home band → G string fret 12 is high; D string fret 17
    // higher still — the best low option is G string fret 12.
    const noPrev = bestPosition(55, BASS_EADG)
    expect(noPrev).toEqual({ string: 3, fret: 12 })

    // Playing around fret 17 on the D string: continuity should keep us there.
    const nearD17 = bestPosition(55, BASS_EADG, { string: 2, fret: 15 })
    expect(nearD17).toEqual({ string: 2, fret: 17 })

    // Playing low on the G string: stay on the G string.
    const nearG = bestPosition(55, BASS_EADG, { string: 3, fret: 10 })
    expect(nearG).toEqual({ string: 3, fret: 12 })
  })

  it('returns null below the low E and above the top fret', () => {
    expect(bestPosition(27, BASS_EADG)).toBeNull() // below open E1
    expect(bestPosition(43 + 25, BASS_EADG)).toBeNull() // above G-string fret 24
  })

  it('works for guitar standard tuning too (E2 open, B3 on the B string)', () => {
    expect(bestPosition(40, GUITAR_STANDARD)).toEqual({ string: 0, fret: 0 })
    expect(bestPosition(59, GUITAR_STANDARD)).toEqual({ string: 4, fret: 0 })
  })
})
