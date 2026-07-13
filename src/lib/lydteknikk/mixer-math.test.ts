import { describe, expect, it } from 'vitest'
import {
  biquadResponse,
  dbToGain,
  gainStaging,
  gainToDb,
  willClip,
  type ChannelLevel,
} from './mixer-math'

describe('dbToGain', () => {
  const cases: [number, number][] = [
    [0, 1],
    [6, 1.9953],
    [-6, 0.5012],
    [20, 10],
    [-20, 0.1],
    [12, 3.981],
    [-60, 0.001],
  ]
  it.each(cases)('%d dB → gain %f', (db, gain) => {
    expect(dbToGain(db)).toBeCloseTo(gain, 3)
  })

  it('−∞ dB is silence (gain 0)', () => {
    expect(dbToGain(-Infinity)).toBe(0)
  })
})

describe('gainToDb', () => {
  const cases: [number, number][] = [
    [1, 0],
    [10, 20],
    [0.5, -6.0206],
    [2, 6.0206],
    [0.1, -20],
  ]
  it.each(cases)('gain %f → %f dB', (gain, db) => {
    expect(gainToDb(gain)).toBeCloseTo(db, 3)
  })

  it('gain 0 and below → −∞ dB', () => {
    expect(gainToDb(0)).toBe(-Infinity)
    expect(gainToDb(-1)).toBe(-Infinity)
  })

  it('round-trips with dbToGain', () => {
    for (const db of [-40, -6, 0, 3, 9]) {
      expect(gainToDb(dbToGain(db))).toBeCloseTo(db, 6)
    }
  })
})

describe('willClip', () => {
  // Each channel is {gainDb, sourceLevel}; clipping is judged after the master.
  const three = (gainDb: number, src = 1): ChannelLevel[] => [
    { gainDb, sourceLevel: src },
    { gainDb, sourceLevel: src },
    { gainDb, sourceLevel: src },
  ]

  const cases: [string, ChannelLevel[], number, boolean][] = [
    ['unity faders, quiet sources, unity master → safe', three(0, 0.2), 0, false],
    ['three full-scale sources at unity already clip', three(0, 1), 0, true],
    ['single quiet source cannot clip', [{ gainDb: 0, sourceLevel: 0.5 }], 0, false],
    ['pulling master down rescues a hot sum', three(0, 0.5), -12, false],
    ['pushing master up tips a safe sum over', three(-6, 0.5), 12, true],
    ['empty desk never clips', [], 6, false],
    ['exactly 1.0 is the edge, not over', [{ gainDb: 0, sourceLevel: 1 }], 0, false],
  ]
  it.each(cases)('%s', (_label, channels, masterDb, expected) => {
    expect(willClip(channels, masterDb)).toBe(expected)
  })
})

describe('gainStaging', () => {
  // [sourceDb, faderDb, masterDb, expectedHeadroom, expectedClipping]
  const cases: [number, number, number, number, boolean][] = [
    [-18, 0, 0, 18, false],
    [-6, 0, 0, 6, false],
    [-3, 2, 2, -1, true],
    [0, 0, 0, 0, false],
    [-12, 6, 6, 0, false],
    [-20, 12, 12, -4, true],
  ]
  it.each(cases)(
    'src %d + fader %d + master %d → headroom %d, clip %s',
    (sourceDb, faderDb, masterDb, headroom, clipping) => {
      const r = gainStaging(sourceDb, faderDb, masterDb)
      expect(r.headroom).toBeCloseTo(headroom, 6)
      expect(r.clipping).toBe(clipping)
    },
  )
})

describe('biquadResponse', () => {
  it('peaking bell peaks at exactly gainDb on the centre frequency', () => {
    expect(biquadResponse('peaking', 1000, 6, 1, 1000)).toBeCloseTo(6, 6)
    expect(biquadResponse('peaking', 1000, -9, 1, 1000)).toBeCloseTo(-9, 6)
  })

  it('peaking bell decays symmetrically an octave either side', () => {
    const up = biquadResponse('peaking', 1000, 6, 1, 2000)
    const down = biquadResponse('peaking', 1000, 6, 1, 500)
    expect(up).toBeCloseTo(down, 6)
    expect(up).toBeLessThan(6)
    expect(up).toBeGreaterThan(0)
  })

  it('a higher-Q peaking bell is narrower (less spill an octave away)', () => {
    const wide = biquadResponse('peaking', 1000, 6, 0.7, 2000)
    const narrow = biquadResponse('peaking', 1000, 6, 3, 2000)
    expect(narrow).toBeLessThan(wide)
  })

  it('low shelf boosts the bottom and fades toward the top', () => {
    const low = biquadResponse('lowshelf', 200, 6, 0.7, 40)
    const high = biquadResponse('lowshelf', 200, 6, 0.7, 4000)
    expect(low).toBeGreaterThan(5.5) // nearly full boost well below corner
    expect(high).toBeLessThan(0.5) // nearly gone well above
    expect(low).toBeGreaterThan(high)
  })

  it('high shelf boosts the top and fades toward the bottom', () => {
    const low = biquadResponse('highshelf', 5000, 6, 0.7, 200)
    const high = biquadResponse('highshelf', 5000, 6, 0.7, 16000)
    expect(high).toBeGreaterThan(5.4)
    expect(low).toBeLessThan(0.5)
    expect(high).toBeGreaterThan(low)
  })

  it('a flat band (0 dB) is flat everywhere', () => {
    for (const f of [50, 500, 5000]) {
      expect(biquadResponse('peaking', 1000, 0, 1, f)).toBeCloseTo(0, 6)
      expect(biquadResponse('lowshelf', 200, 0, 0.7, f)).toBeCloseTo(0, 6)
      expect(biquadResponse('highshelf', 5000, 0, 0.7, f)).toBeCloseTo(0, 6)
    }
  })
})
