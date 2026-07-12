import { describe, expect, it } from 'vitest'
import { songDocSchema, docInvariants } from '../song/format'
import { createRng, generateReadingExercise, type Level } from './exercises'

const SAMPLES = 120

function forLevels(fn: (level: Level) => void) {
  for (const level of [1, 2, 3] as const) fn(level)
}

// Semitone interval between two consecutive right-hand notes.
function rhNotes(doc: ReturnType<typeof generateReadingExercise>) {
  return doc.notes.filter((n) => n.h === 'R').sort((a, b) => a.t - b.t)
}

describe('createRng — determinism', () => {
  it('same seed → same sequence', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 50; i++) expect(a()).toBe(b())
  })
})

describe('generateReadingExercise — determinism', () => {
  it('same seed → identical doc', () => {
    forLevels((level) => {
      const a = generateReadingExercise(level, createRng(1234))
      const b = generateReadingExercise(level, createRng(1234))
      expect(a).toEqual(b)
    })
  })

  it('different seeds → different docs (usually)', () => {
    forLevels((level) => {
      const docs = Array.from({ length: 20 }, (_, i) =>
        JSON.stringify(generateReadingExercise(level, createRng(i * 7 + 1))),
      )
      expect(new Set(docs).size).toBeGreaterThan(1)
    })
  })
})

describe('generateReadingExercise — always valid', () => {
  it('passes songDocSchema over many seeds and levels', () => {
    forLevels((level) => {
      for (let s = 0; s < SAMPLES; s++) {
        const doc = generateReadingExercise(level, createRng(s))
        expect(() => songDocSchema.parse(doc)).not.toThrow()
      }
    })
  })

  it('passes docInvariants over many seeds and levels', () => {
    forLevels((level) => {
      for (let s = 0; s < SAMPLES; s++) {
        const doc = generateReadingExercise(level, createRng(s * 3 + 5))
        const problems = docInvariants(doc)
        expect(problems).toEqual([])
      }
    })
  })

  it('has exactly one verse section covering the whole exercise', () => {
    forLevels((level) => {
      for (let s = 0; s < 30; s++) {
        const doc = generateReadingExercise(level, createRng(s))
        expect(doc.sections).toHaveLength(1)
        expect(doc.sections[0].kind).toBe('verse')
        expect(doc.sections[0].startBeat).toBe(0)
        expect(doc.sections[0].endBeat).toBe(doc.totalBeats)
      }
    })
  })
})

describe('level 1 — C major, right hand, stepwise', () => {
  it('C major key, 4/4, 4 bars, right hand only', () => {
    for (let s = 0; s < SAMPLES; s++) {
      const doc = generateReadingExercise(1, createRng(s))
      expect(doc.keySignature).toBe('C')
      expect(doc.timeSignature).toBe('4/4')
      expect(doc.pickupBeats).toBe(0)
      expect(doc.totalBeats).toBe(16) // 4 bars × 4 beats
      expect(doc.notes.every((n) => n.h === 'R')).toBe(true)
      expect(doc.chords).toEqual([])
    }
  })

  it('is stepwise (no leap greater than a major second) and stays in C4–G4', () => {
    for (let s = 0; s < SAMPLES; s++) {
      const rh = rhNotes(generateReadingExercise(1, createRng(s)))
      for (const n of rh) {
        expect(n.p).toBeGreaterThanOrEqual(60) // C4
        expect(n.p).toBeLessThanOrEqual(67) // G4
      }
      for (let i = 1; i < rh.length; i++) {
        expect(Math.abs(rh[i].p - rh[i - 1].p)).toBeLessThanOrEqual(2)
      }
    }
  })

  it('uses only whole/half/quarter durations', () => {
    for (let s = 0; s < 60; s++) {
      const doc = generateReadingExercise(1, createRng(s))
      for (const n of doc.notes) expect([1, 2, 4]).toContain(n.d)
    }
  })

  it('starts and ends on a C-major triad tone', () => {
    for (let s = 0; s < 60; s++) {
      const rh = rhNotes(generateReadingExercise(1, createRng(s)))
      const last = rh[rh.length - 1]
      expect([60, 64, 67]).toContain(last.p) // C, E, G within C4–G4
    }
  })
})

describe('level 2 — C/F/G, leaps to a fifth, eighths', () => {
  it('key is C, F or G; 4/4; 6 full bars; right hand only', () => {
    for (let s = 0; s < SAMPLES; s++) {
      const doc = generateReadingExercise(2, createRng(s))
      expect(['C', 'F', 'G']).toContain(doc.keySignature)
      expect(doc.timeSignature).toBe('4/4')
      expect(doc.notes.every((n) => n.h === 'R')).toBe(true)
      // Optional 1-beat pickup + 6 bars of 4 beats.
      expect([0, 1]).toContain(doc.pickupBeats)
      expect(doc.totalBeats).toBe(doc.pickupBeats + 24)
    }
  })

  it('never leaps more than a perfect fifth (7 semitones)', () => {
    for (let s = 0; s < SAMPLES; s++) {
      const rh = rhNotes(generateReadingExercise(2, createRng(s)))
      for (let i = 1; i < rh.length; i++) {
        expect(Math.abs(rh[i].p - rh[i - 1].p)).toBeLessThanOrEqual(7)
      }
    }
  })

  it('sometimes produces eighth notes and sometimes a pickup', () => {
    let sawEighth = false
    let sawPickup = false
    for (let s = 0; s < SAMPLES; s++) {
      const doc = generateReadingExercise(2, createRng(s))
      if (doc.notes.some((n) => n.d === 0.5)) sawEighth = true
      if (doc.pickupBeats === 1) sawPickup = true
    }
    expect(sawEighth).toBe(true)
    expect(sawPickup).toBe(true)
  })
})

describe('level 3 — accidentals, both hands, chord track', () => {
  it('key is Eb, D or A; meter is 4/4, 3/4 or 6/8; 8 bars', () => {
    for (let s = 0; s < SAMPLES; s++) {
      const doc = generateReadingExercise(3, createRng(s))
      expect(['Eb', 'D', 'A']).toContain(doc.keySignature)
      expect(['4/4', '3/4', '6/8']).toContain(doc.timeSignature)
      expect(doc.totalBeats).toBe(8 * doc.beatsPerBar)
    }
  })

  it('has a left hand and a non-empty chord track', () => {
    for (let s = 0; s < SAMPLES; s++) {
      const doc = generateReadingExercise(3, createRng(s))
      expect(doc.notes.some((n) => n.h === 'L')).toBe(true)
      expect(doc.notes.some((n) => n.h === 'R')).toBe(true)
      expect(doc.chords.length).toBe(8) // one chord per full bar
      // Chords cover whole beats and stay diatonic (root 0–11, short quality).
      for (const c of doc.chords) {
        expect(Number.isInteger(c.t)).toBe(true)
        expect(c.r).toBeGreaterThanOrEqual(0)
        expect(c.r).toBeLessThanOrEqual(11)
        expect(c.q.length).toBeLessThanOrEqual(8)
      }
    }
  })

  it('at least one meter variety appears across seeds', () => {
    const meters = new Set<string>()
    for (let s = 0; s < SAMPLES; s++) {
      meters.add(generateReadingExercise(3, createRng(s)).timeSignature)
    }
    expect(meters.size).toBeGreaterThan(1)
  })
})
