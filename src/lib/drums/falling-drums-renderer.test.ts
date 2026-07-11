import { describe, it, expect } from 'vitest'
import { laneGeometry, hitCenterX } from './falling-drums-renderer'
import { noteScreenY } from '../falling-renderer'
import { LANES } from './drum-lanes'

// The canvas drawing needs a DOM; the geometry it stands on is pure: lanes tile
// the width evenly left→right, every pitch centres inside its own lane, and the
// time→y mapping is the shared noteScreenY (already covered by its own tests —
// here we only pin OUR use of it: onset at currentBeat sits on the hit line).

describe('laneGeometry', () => {
  it('tiles the full width evenly with one column per lane', () => {
    const width = 900
    const lanes = laneGeometry(width)
    expect(lanes).toHaveLength(LANES.length)
    for (const l of lanes) expect(l.w).toBeCloseTo(width / LANES.length)
    // Contiguous, ascending, and ending exactly at the right edge.
    for (let i = 1; i < lanes.length; i++) {
      expect(lanes[i].x).toBeCloseTo(lanes[i - 1].x + lanes[i - 1].w)
    }
    const last = lanes[lanes.length - 1]
    expect(last.x + last.w).toBeCloseTo(width)
  })
})

describe('hitCenterX', () => {
  const width = 900

  it('centres every canonical pitch inside its own lane', () => {
    const lanes = laneGeometry(width)
    LANES.forEach((lane, i) => {
      const cx = hitCenterX(lane.padPitch, width)
      expect(cx).not.toBeNull()
      expect(cx!).toBeGreaterThan(lanes[i].x)
      expect(cx!).toBeLessThan(lanes[i].x + lanes[i].w)
      expect(cx!).toBeCloseTo(lanes[i].x + lanes[i].w / 2)
    })
  })

  it('kick is left of snare is left of ride (left → right kit order)', () => {
    const kick = hitCenterX(36, width)!
    const snare = hitCenterX(38, width)!
    const ride = hitCenterX(51, width)!
    expect(kick).toBeLessThan(snare)
    expect(snare).toBeLessThan(ride)
  })

  it('aliases land in the same x as their canonical pitch', () => {
    expect(hitCenterX(35, width)).toBe(hitCenterX(36, width))
    expect(hitCenterX(40, width)).toBe(hitCenterX(38, width))
  })

  it('returns null for pitches without a lane', () => {
    expect(hitCenterX(60, width)).toBeNull()
  })
})

describe('time → y (our use of noteScreenY)', () => {
  it('a hit at currentBeat sits exactly on the hit line', () => {
    expect(noteScreenY(8, 8, 4, 260)).toBe(260)
  })
  it('a hit one lookahead ahead enters at the top', () => {
    expect(noteScreenY(12, 8, 4, 260)).toBe(0)
  })
})
