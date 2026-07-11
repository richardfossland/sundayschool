import { describe, it, expect } from 'vitest'
import type { SongChord } from '@/types/song'
import { pitchClass } from '@/lib/music'
import { bestCapo, shapesAtCapo } from './capo'
import { shapePitches } from './chord-shapes'

// The advisor's fasit: barre-heavy keys (F) move to a capo; open-grip keys
// (G/C/D) stay at 0. Chords are sounding roots (pitch classes), one occurrence
// each unless the song genuinely repeats them.

const ch = (r: number, q = ''): SongChord => ({ t: 0, d: 4, r, q })
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, Bb: 10 }

describe('bestCapo', () => {
  it('a song in F suggests capo 1 (E-form grips: E, A, B7)', () => {
    // I–IV–V7 in F: F, Bb, C7.
    const { capo } = bestCapo([ch(PC.F), ch(PC.Bb), ch(PC.C, '7')])
    expect(capo).toBe(1)
  })

  it('a song in G stays at capo 0', () => {
    const { capo } = bestCapo([ch(PC.G), ch(PC.C), ch(PC.D), ch(PC.D, '7')])
    expect(capo).toBe(0)
  })

  it('a song in C stays at capo 0', () => {
    const { capo } = bestCapo([ch(PC.C), ch(PC.F), ch(PC.G), ch(PC.A, 'm')])
    expect(capo).toBe(0)
  })

  it('a song in D stays at capo 0', () => {
    const { capo } = bestCapo([ch(PC.D), ch(PC.G), ch(PC.A), ch(PC.B, 'm')])
    expect(capo).toBe(0)
  })

  it('a song in Eb finds a low capo mapping to open grips', () => {
    // Eb, Ab, Bb → capo 1 gives D, G, A (all open).
    const { capo } = bestCapo([ch(3), ch(8), ch(10)])
    expect(capo).toBe(1)
  })

  it('respects maxCapo', () => {
    const { capo } = bestCapo([ch(PC.F), ch(PC.Bb), ch(PC.C, '7')], 0)
    expect(capo).toBe(0)
  })

  it('empty chord list suggests capo 0', () => {
    expect(bestCapo([]).capo).toBe(0)
  })

  it('a chord without any grip drags the score down', () => {
    const playable = bestCapo([ch(PC.G)])
    const unplayable = bestCapo([ch(PC.G), ch(PC.C, 'dim')])
    expect(unplayable.score).toBeLessThan(playable.score)
  })
})

describe('shapesAtCapo', () => {
  it('maps chord index → the grip PLAYED at the capo (transposed down)', () => {
    // F at capo 1 is played as an E grip: pitch classes of shape + capo = F chord.
    const chords = [ch(PC.F), ch(PC.Bb)]
    const map = shapesAtCapo(chords, 1)
    expect(map.size).toBe(2)
    const fShape = map.get(0)!
    const soundingPcs = new Set(shapePitches(fShape).map((p) => pitchClass(p + 1)))
    expect(soundingPcs).toEqual(new Set([5, 9, 0])) // F A C
  })

  it('capo 0 returns grips for the sounding roots directly', () => {
    const map = shapesAtCapo([ch(PC.G)], 0)
    const pcs = new Set(shapePitches(map.get(0)!).map(pitchClass))
    expect(pcs).toEqual(new Set([7, 11, 2])) // G B D
  })

  it('omits chords that have no grip', () => {
    const map = shapesAtCapo([ch(PC.G), ch(PC.C, 'dim')], 0)
    expect(map.has(0)).toBe(true)
    expect(map.has(1)).toBe(false)
  })
})
