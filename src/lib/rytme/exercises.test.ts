import { describe, expect, it } from 'vitest'
import { songDocSchema, docInvariants } from '@/lib/song/format'
import {
  createRng,
  generateRhythm,
  rhythmDictation,
  seededShuffle,
  type Level,
} from './exercises'

const SAMPLES = 120

function forLevels(fn: (level: Level) => void) {
  for (const level of [1, 2, 3] as const) fn(level)
}

describe('createRng — determinism', () => {
  it('same seed → same sequence', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 50; i++) expect(a()).toBe(b())
  })

  it('different seeds → different sequences', () => {
    const a = Array.from({ length: 10 }, ((r) => () => r())(createRng(1)))
    const b = Array.from({ length: 10 }, ((r) => () => r())(createRng(2)))
    expect(a).not.toEqual(b)
  })

  it('returns floats in [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 100; i++) {
      const x = rng()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})

describe('seededShuffle', () => {
  it('is a permutation and deterministic', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7]
    const a = seededShuffle(arr, createRng(9))
    const b = seededShuffle(arr, createRng(9))
    expect(a).toEqual(b)
    expect([...a].sort()).toEqual(arr)
  })
})

describe('generateRhythm — determinism', () => {
  it('same seed → identical hits and doc', () => {
    forLevels((level) => {
      const a = generateRhythm(level, createRng(1234))
      const b = generateRhythm(level, createRng(1234))
      expect(a.hits).toEqual(b.hits)
      expect(a.doc).toEqual(b.doc)
      expect(a.lengthBeats).toBe(b.lengthBeats)
    })
  })
})

describe('generateRhythm — doc validity', () => {
  it('every generated doc passes songDocSchema + docInvariants', () => {
    forLevels((level) => {
      const rng = createRng(level * 1000 + 7)
      for (let i = 0; i < SAMPLES; i++) {
        const { doc } = generateRhythm(level, rng)
        expect(() => songDocSchema.parse(doc)).not.toThrow()
        expect(docInvariants(doc)).toEqual([])
      }
    })
  })

  it('hits mirror the doc notes (same onsets, snare pitch 38, all in [0,length])', () => {
    forLevels((level) => {
      const rng = createRng(level * 31 + 3)
      for (let i = 0; i < SAMPLES; i++) {
        const { hits, doc, lengthBeats } = generateRhythm(level, rng)
        expect(hits.length).toBe(doc.notes.length)
        expect(hits.length).toBeGreaterThanOrEqual(2)
        for (const h of hits) {
          expect(h.p).toBe(38)
          expect(h.t).toBeGreaterThanOrEqual(0)
          expect(h.t).toBeLessThan(lengthBeats)
        }
        // Same onset set as the notation notes.
        const hs = hits.map((h) => Math.round(h.t * 1000)).sort((a, b) => a - b)
        const ns = doc.notes.map((n) => Math.round(n.t * 1000)).sort((a, b) => a - b)
        expect(hs).toEqual(ns)
        // Notation notes are all on the read pitch B4.
        for (const n of doc.notes) expect(n.p).toBe(71)
      }
    })
  })
})

describe('generateRhythm — level constraints', () => {
  it('level 1 = 2 bars of 4/4, only quarters/halves', () => {
    const rng = createRng(11)
    for (let i = 0; i < SAMPLES; i++) {
      const { doc, lengthBeats } = generateRhythm(1, rng)
      expect(doc.timeSignature).toBe('4/4')
      expect(lengthBeats).toBe(8)
      for (const n of doc.notes) expect([1, 2]).toContain(n.d)
    }
  })

  it('level 2 = 4 bars of 4/4, adds eighths + dotted quarters, no triplets/16ths', () => {
    const rng = createRng(22)
    for (let i = 0; i < SAMPLES; i++) {
      const { doc, lengthBeats } = generateRhythm(2, rng)
      expect(doc.timeSignature).toBe('4/4')
      expect(lengthBeats).toBe(16)
      for (const n of doc.notes) expect([0.5, 1, 1.5, 2]).toContain(n.d)
    }
  })

  it('level 3 uses 4/4, 3/4 or 6/8 and can introduce triplets and 16ths', () => {
    const rng = createRng(33)
    const meters = new Set<string>()
    let sawTriplet = false
    let sawSixteenth = false
    for (let i = 0; i < 400; i++) {
      const { doc } = generateRhythm(3, rng)
      meters.add(doc.timeSignature)
      for (const n of doc.notes) {
        if (Math.abs(n.d - 1 / 3) < 1e-6) sawTriplet = true
        if (Math.abs(n.d - 0.25) < 1e-6) sawSixteenth = true
      }
    }
    expect(meters.has('4/4')).toBe(true)
    expect(meters.has('3/4')).toBe(true)
    expect(meters.has('6/8')).toBe(true)
    expect(sawTriplet).toBe(true)
    expect(sawSixteenth).toBe(true)
  })
})

describe('rhythmDictation', () => {
  it('gives 3 distinct notated options with a valid correctIndex', () => {
    forLevels((level) => {
      const rng = createRng(level * 7 + 5)
      for (let i = 0; i < SAMPLES; i++) {
        const { options, correctIndex } = rhythmDictation(level, rng)
        expect(options.length).toBe(3)
        expect(correctIndex).toBeGreaterThanOrEqual(0)
        expect(correctIndex).toBeLessThan(3)
        // All three options must be different rhythms.
        const sigs = options.map((o) => o.hits.map((h) => Math.round(h.t * 1000)).join(','))
        expect(new Set(sigs).size).toBe(3)
        // Every option is a valid doc.
        for (const o of options) {
          expect(() => songDocSchema.parse(o.doc)).not.toThrow()
          expect(docInvariants(o.doc)).toEqual([])
        }
      }
    })
  })

  it('is deterministic per seed', () => {
    const a = rhythmDictation(3, createRng(999))
    const b = rhythmDictation(3, createRng(999))
    expect(a.correctIndex).toBe(b.correctIndex)
    expect(a.options.map((o) => o.hits)).toEqual(b.options.map((o) => o.hits))
  })
})
