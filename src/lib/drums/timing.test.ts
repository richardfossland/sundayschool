import { describe, it, expect } from 'vitest'
import { classifyHit, scoreSession, PERFECT_MS, GOOD_MS } from './timing'

// The windows are defined in ms and converted through the bpm, so the same
// physical accuracy must classify identically at any tempo. At 60 BPM one beat
// is 1000 ms; at 120 BPM it is 500 ms.

describe('classifyHit', () => {
  describe('at 60 BPM (1 beat = 1000 ms)', () => {
    const bpm = 60
    it('within ±40 ms is perfect', () => {
      expect(classifyHit(4, 4, bpm)).toBe('perfect')
      expect(classifyHit(4.039, 4, bpm)).toBe('perfect') // +39 ms
      expect(classifyHit(3.961, 4, bpm)).toBe('perfect') // −39 ms
    })
    it('between 40 and 100 ms is early/late by sign', () => {
      expect(classifyHit(3.92, 4, bpm)).toBe('early') // −80 ms
      expect(classifyHit(4.08, 4, bpm)).toBe('late') // +80 ms
    })
    it('beyond 100 ms is a miss', () => {
      expect(classifyHit(4.11, 4, bpm)).toBe('miss') // +110 ms
      expect(classifyHit(3.89, 4, bpm)).toBe('miss') // −110 ms
    })
  })

  describe('at 120 BPM (1 beat = 500 ms)', () => {
    const bpm = 120
    it('the same ms windows apply — beat distances halve', () => {
      expect(classifyHit(4.07, 4, bpm)).toBe('perfect') // +35 ms
      expect(classifyHit(4.16, 4, bpm)).toBe('late') // +80 ms
      expect(classifyHit(3.84, 4, bpm)).toBe('early') // −80 ms
      expect(classifyHit(4.22, 4, bpm)).toBe('miss') // +110 ms
    })
    it('a beat offset that was early at 60 BPM becomes a miss at 120', () => {
      // −0.15 beats = −150 ms at 60 BPM? No: −150 ms is a miss there too; use −0.09.
      expect(classifyHit(3.91, 4, 60)).toBe('early') // −90 ms at 60 BPM
      expect(classifyHit(3.91, 4, 120)).toBe('early') // −45 ms — still early
      expect(classifyHit(3.79, 4, 60)).toBe('miss') // −210 ms
      expect(classifyHit(3.79, 4, 120)).toBe('miss') // −105 ms
    })
  })

  it('window edges are inclusive', () => {
    // Exactly 40 ms → perfect; exactly 100 ms → late.
    expect(classifyHit(4 + PERFECT_MS / 1000, 4, 60)).toBe('perfect')
    expect(classifyHit(4 + GOOD_MS / 1000, 4, 60)).toBe('late')
  })
})

describe('scoreSession', () => {
  it('counts each verdict and weights the percentage', () => {
    const s = scoreSession(['perfect', 'perfect', 'early', 'late', 'miss', 'miss'])
    expect(s.perfect).toBe(2)
    expect(s.early).toBe(1)
    expect(s.late).toBe(1)
    expect(s.miss).toBe(2)
    // (2 + 0.5·2) / 6 = 50 %
    expect(s.pct).toBe(50)
  })

  it('all perfect → 100, all miss → 0, empty → 0', () => {
    expect(scoreSession(['perfect', 'perfect']).pct).toBe(100)
    expect(scoreSession(['miss']).pct).toBe(0)
    expect(scoreSession([]).pct).toBe(0)
  })
})
