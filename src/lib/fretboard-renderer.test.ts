import { describe, it, expect } from 'vitest'
import { laneRect } from './fretboard-renderer'
import { noteScreenY } from './falling-renderer'

// The draw function needs a canvas; the geometry it stands on is `laneRect`
// (string → vertical lane x) plus the shared `noteScreenY` (beat → y), which
// together fully determine where a note bar lands. Pure position tests.

describe('laneRect — 4 bass lanes across 480px', () => {
  const W = 480

  it('lane 0 (low E) is the LEFTMOST lane', () => {
    const lo = laneRect(0, 4, W)
    const hi = laneRect(3, 4, W)
    expect(lo.x).toBeLessThan(hi.x)
    expect(lo.x).toBeGreaterThanOrEqual(0)
  })

  it('lanes are equal-width slots with inner padding, tiling the full width', () => {
    const slot = W / 4
    for (let s = 0; s < 4; s++) {
      const { x, w } = laneRect(s, 4, W)
      expect(x).toBeGreaterThanOrEqual(s * slot)
      expect(x + w).toBeLessThanOrEqual((s + 1) * slot)
      expect(w).toBeGreaterThan(0)
    }
    // Same padding everywhere → same width everywhere.
    expect(laneRect(0, 4, W).w).toBeCloseTo(laneRect(3, 4, W).w)
  })

  it('lane centres are evenly spaced', () => {
    const centres = [0, 1, 2, 3].map((s) => {
      const { x, w } = laneRect(s, 4, W)
      return x + w / 2
    })
    const step = centres[1] - centres[0]
    expect(step).toBeCloseTo(W / 4)
    expect(centres[3] - centres[2]).toBeCloseTo(step)
  })

  it('clamps out-of-range lane indices instead of escaping the canvas', () => {
    const clampedHi = laneRect(99, 4, W)
    expect(clampedHi.x + clampedHi.w).toBeLessThanOrEqual(W)
    const clampedLo = laneRect(-3, 4, W)
    expect(clampedLo.x).toBeGreaterThanOrEqual(0)
  })
})

describe('fall physics — shared noteScreenY drives the vertical axis', () => {
  const hitY = 220
  const look = 4

  it('a note at the current beat sits exactly on the hit line', () => {
    expect(noteScreenY(8, 8, look, hitY)).toBe(hitY)
  })

  it('a note one lookahead ahead enters at the top (y = 0)', () => {
    expect(noteScreenY(8 + look, 8, look, hitY)).toBe(0)
  })

  it('later onsets are higher up (bars fall downward)', () => {
    const near = noteScreenY(9, 8, look, hitY)
    const far = noteScreenY(11, 8, look, hitY)
    expect(far).toBeLessThan(near)
  })
})
