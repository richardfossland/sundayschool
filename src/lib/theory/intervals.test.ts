import { describe, expect, it } from 'vitest'
import {
  intervalBetween,
  intervalName,
  intervalParts,
  MAX_INTERVAL,
  SIMPLE_INTERVALS,
} from './intervals'

describe('intervalName — simple intervals', () => {
  it('names all 13 simple intervals in Norwegian', () => {
    expect(intervalName(0)).toBe('ren prim')
    expect(intervalName(1)).toBe('liten sekund')
    expect(intervalName(2)).toBe('stor sekund')
    expect(intervalName(3)).toBe('liten ters')
    expect(intervalName(4)).toBe('stor ters')
    expect(intervalName(5)).toBe('ren kvart')
    expect(intervalName(6)).toBe('tritonus')
    expect(intervalName(7)).toBe('ren kvint')
    expect(intervalName(8)).toBe('liten sekst')
    expect(intervalName(9)).toBe('stor sekst')
    expect(intervalName(10)).toBe('liten septim')
    expect(intervalName(11)).toBe('stor septim')
    expect(intervalName(12)).toBe('ren oktav')
  })

  it('is direction-agnostic', () => {
    expect(intervalName(-7)).toBe('ren kvint')
    expect(intervalName(-3)).toBe('liten ters')
  })
})

describe('intervalName — compound intervals', () => {
  it('names compound intervals up to two octaves', () => {
    expect(intervalName(13)).toBe('liten none')
    expect(intervalName(14)).toBe('stor none')
    expect(intervalName(15)).toBe('liten desim')
    expect(intervalName(16)).toBe('stor desim')
    expect(intervalName(17)).toBe('ren undesim')
    expect(intervalName(18)).toBe('oktav + tritonus')
    expect(intervalName(19)).toBe('ren duodesim')
    expect(intervalName(24)).toBe('to oktaver')
  })

  it('throws beyond two octaves', () => {
    expect(() => intervalName(MAX_INTERVAL + 1)).toThrow(RangeError)
  })
})

describe('intervalParts — quality/number decomposition', () => {
  it('decomposes simple intervals', () => {
    expect(intervalParts(0)).toEqual({ quality: 'ren', number: 1 })
    expect(intervalParts(4)).toEqual({ quality: 'stor', number: 3 })
    expect(intervalParts(6)).toEqual({ quality: 'tritonus', number: 4 })
    expect(intervalParts(7)).toEqual({ quality: 'ren', number: 5 })
    expect(intervalParts(11)).toEqual({ quality: 'stor', number: 7 })
    expect(intervalParts(12)).toEqual({ quality: 'ren', number: 8 })
  })

  it('adds 7 to the number per octave for compound intervals', () => {
    expect(intervalParts(14)).toEqual({ quality: 'stor', number: 9 })
    expect(intervalParts(19)).toEqual({ quality: 'ren', number: 12 })
  })
})

describe('intervalBetween', () => {
  it('is the absolute semitone distance', () => {
    expect(intervalBetween(60, 67)).toBe(7)
    expect(intervalBetween(67, 60)).toBe(7)
    expect(intervalBetween(60, 60)).toBe(0)
    expect(intervalBetween(60, 76)).toBe(16)
  })
})

describe('SIMPLE_INTERVALS', () => {
  it('lists sekund–oktav (1–12) in order with names', () => {
    expect(SIMPLE_INTERVALS).toHaveLength(12)
    expect(SIMPLE_INTERVALS[0]).toEqual({ semitones: 1, name: 'liten sekund' })
    expect(SIMPLE_INTERVALS[11]).toEqual({ semitones: 12, name: 'ren oktav' })
  })
})
