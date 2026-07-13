import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addEntry,
  analyzeSetlist,
  circleDistance,
  createSetlist,
  deleteSetlist,
  keyFlowScore,
  loadSetlists,
  moveEntry,
  removeEntryAt,
  removeSetlist,
  saveSetlist,
  setEntryKey,
  transitionSuggestions,
  upsertSetlist,
  type SetlistEntry,
} from './setlist'

// ── Kvintsirkel-flyt ─────────────────────────────────────────────────────────

describe('circleDistance', () => {
  it('is 0 for the same key', () => {
    for (let k = 0; k < 12; k++) expect(circleDistance(k, k)).toBe(0)
  })

  it('is 1 for neighbours on the circle (a fifth apart)', () => {
    expect(circleDistance(0, 7)).toBe(1) // C → G
    expect(circleDistance(0, 5)).toBe(1) // C → F
    expect(circleDistance(3, 10)).toBe(1) // Eb → Bb
  })

  it('is 6 for the tritone (opposite side of the circle)', () => {
    expect(circleDistance(0, 6)).toBe(6) // C → F#
  })

  it('is symmetric and never exceeds 6', () => {
    for (let a = 0; a < 12; a++) {
      for (let b = 0; b < 12; b++) {
        expect(circleDistance(a, b)).toBe(circleDistance(b, a))
        expect(circleDistance(a, b)).toBeLessThanOrEqual(6)
      }
    }
  })
})

describe('keyFlowScore', () => {
  it('rates 0–1 steps god, 2 ok, 3+ krevende', () => {
    expect(keyFlowScore(0, 0)).toEqual({ steps: 0, rating: 'god' })
    expect(keyFlowScore(0, 7)).toEqual({ steps: 1, rating: 'god' }) // C → G
    expect(keyFlowScore(0, 2)).toEqual({ steps: 2, rating: 'ok' }) // C → D
    expect(keyFlowScore(0, 9)).toEqual({ steps: 3, rating: 'krevende' }) // C → A
    expect(keyFlowScore(0, 6)).toEqual({ steps: 6, rating: 'krevende' }) // C → F#
  })
})

// ── Overgangsforslag ─────────────────────────────────────────────────────────

describe('transitionSuggestions', () => {
  it('names the dominant of the new key and a ii–V into it (C → G)', () => {
    const s = transitionSuggestions(0, 7) // → G major: V = D7, ii = Am7
    expect(s.length).toBeGreaterThanOrEqual(2)
    expect(s.length).toBeLessThanOrEqual(3)
    expect(s[0]).toContain('D7')
    expect(s[0]).toContain('dominanten i G')
    expect(s[1]).toContain('Am7')
    expect(s[1]).toContain('D7')
  })

  it('suggests a semitone modulation for a small upward step', () => {
    const s = transitionSuggestions(0, 1) // C → Db (up 1 semitone)
    expect(s.some((line) => line.includes('Modulér opp 1 halvtone'))).toBe(true)
  })

  it('suggests a pad for a distant key instead of a modulation', () => {
    const s = transitionSuggestions(0, 6) // C → F# (tritone)
    expect(s.some((line) => line.includes('pad'))).toBe(true)
    expect(s.some((line) => line.includes('Modulér'))).toBe(false)
  })

  it('spells chords enharmonically in the flat target key (Eb → Ab)', () => {
    const s = transitionSuggestions(3, 8) // → Ab major: V = Eb7, ii = Bbm7
    expect(s[0]).toContain('Eb7')
    expect(s[1]).toContain('Bbm7')
    // No sharp spelling in a flat key.
    expect(s.join(' ')).not.toContain('G#')
  })

  it('returns a single same-key note when both keys match', () => {
    const s = transitionSuggestions(2, 2)
    expect(s).toHaveLength(1)
    expect(s[0]).toContain('Samme toneart')
  })
})

// ── Setliste-analyse ─────────────────────────────────────────────────────────

describe('analyzeSetlist', () => {
  const e = (workSlug: string, targetKey: number): SetlistEntry => ({ workSlug, targetKey })

  it('has one transition per adjacent pair', () => {
    const { perTransition } = analyzeSetlist([e('a', 0), e('b', 7), e('c', 2)])
    expect(perTransition).toHaveLength(2)
    expect(perTransition[0]).toMatchObject({ fromIndex: 0, fromKey: 0, toKey: 7, rating: 'god' })
    expect(perTransition[1]).toMatchObject({ fromIndex: 1, fromKey: 7, toKey: 2, rating: 'god' })
  })

  it('treats empty and single-entry lists as trivially god', () => {
    expect(analyzeSetlist([])).toEqual({ perTransition: [], totalRating: 'god' })
    expect(analyzeSetlist([e('a', 4)]).totalRating).toBe('god')
  })

  it('rates the whole list by average distance', () => {
    // Two big jumps (C→A = 3, A→Eb = 3) → average 3 → krevende.
    const { totalRating } = analyzeSetlist([e('a', 0), e('b', 9), e('c', 3)])
    expect(totalRating).toBe('krevende')
  })
})

// ── Rene innslag-operasjoner ─────────────────────────────────────────────────

describe('entry operations', () => {
  const base: SetlistEntry[] = [
    { workSlug: 'a', targetKey: 0 },
    { workSlug: 'b', targetKey: 2 },
    { workSlug: 'c', targetKey: 4 },
  ]

  it('addEntry appends without mutating the input', () => {
    const out = addEntry(base, { workSlug: 'd', targetKey: 5 })
    expect(out).toHaveLength(4)
    expect(out[3]).toEqual({ workSlug: 'd', targetKey: 5 })
    expect(base).toHaveLength(3)
  })

  it('removeEntryAt drops the indexed entry, ignores out-of-range', () => {
    expect(removeEntryAt(base, 1).map((x) => x.workSlug)).toEqual(['a', 'c'])
    expect(removeEntryAt(base, 9)).toBe(base)
  })

  it('moveEntry swaps neighbours and clamps at the ends', () => {
    expect(moveEntry(base, 0, 1).map((x) => x.workSlug)).toEqual(['b', 'a', 'c'])
    expect(moveEntry(base, 2, -1).map((x) => x.workSlug)).toEqual(['a', 'c', 'b'])
    expect(moveEntry(base, 0, -1)).toBe(base) // already at the top
    expect(moveEntry(base, 2, 1)).toBe(base) // already at the bottom
  })

  it('setEntryKey wraps the pitch class and leaves others alone', () => {
    expect(setEntryKey(base, 1, 7)[1].targetKey).toBe(7)
    expect(setEntryKey(base, 1, 14)[1].targetKey).toBe(2) // wraps 14 → 2
    expect(setEntryKey(base, 9, 3)).toBe(base)
  })
})

// ── Rene setliste-operasjoner ─────────────────────────────────────────────────

describe('setlist operations', () => {
  it('createSetlist stamps id + updatedAt (injectable for tests)', () => {
    const sl = createSetlist('Søndag', [{ workSlug: 'a', targetKey: 0 }], 'id1', 1000)
    expect(sl).toEqual({
      id: 'id1',
      name: 'Søndag',
      entries: [{ workSlug: 'a', targetKey: 0 }],
      updatedAt: 1000,
    })
  })

  it('upsertSetlist replaces by id and keeps newest first', () => {
    const a = createSetlist('A', [], 'a', 100)
    const b = createSetlist('B', [], 'b', 200)
    let lists = upsertSetlist(upsertSetlist([], a), b)
    expect(lists.map((l) => l.id)).toEqual(['b', 'a'])
    // Replace A with a newer timestamp → it jumps to the top.
    lists = upsertSetlist(lists, createSetlist('A2', [], 'a', 300))
    expect(lists.map((l) => l.id)).toEqual(['a', 'b'])
    expect(lists[0].name).toBe('A2')
    expect(lists).toHaveLength(2)
  })

  it('removeSetlist drops by id', () => {
    const lists = [createSetlist('A', [], 'a', 1), createSetlist('B', [], 'b', 2)]
    expect(removeSetlist(lists, 'a').map((l) => l.id)).toEqual(['b'])
  })
})

// ── localStorage-wrapper ──────────────────────────────────────────────────────

function installStorage() {
  const map = new Map<string, string>()
  const storage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  }
  ;(globalThis as { window?: unknown }).window = {}
  ;(globalThis as { localStorage?: unknown }).localStorage = storage
  return map
}

describe('localStorage wrapper', () => {
  beforeEach(() => installStorage())
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window
    delete (globalThis as { localStorage?: unknown }).localStorage
  })

  it('returns [] with no stored data', () => {
    expect(loadSetlists()).toEqual([])
  })

  it('round-trips a saved setlist and reads it back newest-first', () => {
    saveSetlist(createSetlist('Kveld', [{ workSlug: 'a', targetKey: 0 }], 'k'))
    saveSetlist(createSetlist('Morgen', [], 'm'))
    const lists = loadSetlists()
    expect(lists.map((l) => l.name)).toEqual(['Morgen', 'Kveld'])
    expect(lists[1].entries).toEqual([{ workSlug: 'a', targetKey: 0 }])
  })

  it('saveSetlist re-stamps updatedAt on write', () => {
    const before = Date.now()
    const [saved] = saveSetlist(createSetlist('X', [], 'x', 1))
    expect(saved.updatedAt).toBeGreaterThanOrEqual(before)
  })

  it('deleteSetlist removes only the target', () => {
    saveSetlist(createSetlist('A', [], 'a'))
    saveSetlist(createSetlist('B', [], 'b'))
    const left = deleteSetlist('a')
    expect(left.map((l) => l.id)).toEqual(['b'])
    expect(loadSetlists().map((l) => l.id)).toEqual(['b'])
  })

  it('ignores corrupt / malformed stored data', () => {
    const map = installStorage()
    map.set('sundayschool_setlists', 'not json{')
    expect(loadSetlists()).toEqual([])
    map.set('sundayschool_setlists', JSON.stringify([{ id: 'x' }, { bogus: true }]))
    expect(loadSetlists()).toEqual([])
  })
})
