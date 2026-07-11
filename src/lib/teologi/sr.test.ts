import { describe, expect, it } from 'vitest'
import {
  addDays,
  BOX_INTERVALS,
  dueVerses,
  isDue,
  MAX_BOX,
  review,
  type SrState,
} from './sr'

describe('sr — addDays', () => {
  it('adds days without DST drift', () => {
    expect(addDays('2026-01-01', 1)).toBe('2026-01-02')
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-03-28', 3)).toBe('2026-03-31') // across a DST boundary
    expect(addDays('2026-12-31', 30)).toBe('2027-01-30')
  })
})

describe('sr — dueVerses / isDue', () => {
  it('treats an unseen verse as due', () => {
    expect(isDue({}, 'x', '2026-01-01')).toBe(true)
    expect(dueVerses({}, '2026-01-01', ['a', 'b'])).toEqual(['a', 'b'])
  })

  it('returns only verses due on/before today, in input order', () => {
    const state: SrState = {
      a: { box: 1, due: '2026-01-01', reps: 1 },
      b: { box: 3, due: '2026-01-10', reps: 1 },
      c: { box: 2, due: '2026-01-05', reps: 1 },
    }
    expect(dueVerses(state, '2026-01-05', ['a', 'b', 'c'])).toEqual(['a', 'c'])
  })

  it('falls back to state keys when no ids are given', () => {
    const state: SrState = { a: { box: 1, due: '2026-01-01', reps: 1 } }
    expect(dueVerses(state, '2026-01-02')).toEqual(['a'])
  })
})

describe('sr — review progression', () => {
  it('promotes one box on correct and pushes due out by that interval', () => {
    let state: SrState = {}
    state = review(state, 'v', true, '2026-01-01')
    // first correct → box 2, due = today + BOX_INTERVALS[2] (3 days)
    expect(state.v.box).toBe(2)
    expect(state.v.reps).toBe(1)
    expect(state.v.due).toBe(addDays('2026-01-01', BOX_INTERVALS[2]))

    state = review(state, 'v', true, '2026-01-04')
    expect(state.v.box).toBe(3)
    expect(state.v.reps).toBe(2)
    expect(state.v.due).toBe(addDays('2026-01-04', BOX_INTERVALS[3]))
  })

  it('caps the box at MAX_BOX', () => {
    let state: SrState = { v: { box: MAX_BOX, due: '2026-01-01', reps: 9 } }
    state = review(state, 'v', true, '2026-01-01')
    expect(state.v.box).toBe(MAX_BOX)
    expect(state.v.due).toBe(addDays('2026-01-01', BOX_INTERVALS[MAX_BOX]))
    expect(state.v.reps).toBe(10)
  })

  it('drops to box 1 with due tomorrow on a wrong answer', () => {
    let state: SrState = { v: { box: 4, due: '2026-01-01', reps: 5 } }
    state = review(state, 'v', false, '2026-06-10')
    expect(state.v.box).toBe(1)
    expect(state.v.due).toBe('2026-06-11') // today + 1
    expect(state.v.reps).toBe(6)
  })

  it('is pure — does not mutate the input state', () => {
    const state: SrState = { v: { box: 1, due: '2026-01-01', reps: 0 } }
    const next = review(state, 'v', true, '2026-01-01')
    expect(state.v.box).toBe(1) // original untouched
    expect(next).not.toBe(state)
    expect(next.v).not.toBe(state.v)
  })
})
