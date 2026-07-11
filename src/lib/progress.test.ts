import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getProgress, recordPractice, sectionKey, todayKey } from './progress'

// progress.ts is browser-facing (guards on `typeof window`), so the node-env
// test installs a tiny in-memory localStorage + window before each case.
const STORE_KEY = 'sundayschool_progress'

function installStorage(seed?: unknown) {
  const map = new Map<string, string>()
  if (seed !== undefined) map.set(STORE_KEY, JSON.stringify(seed))
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

afterEach(() => {
  delete (globalThis as { window?: unknown }).window
  delete (globalThis as { localStorage?: unknown }).localStorage
})

describe('progress — subject-prefixed keys', () => {
  beforeEach(() => installStorage())

  it('records and reads a subject-prefixed key verbatim', () => {
    recordPractice('piano:amazing-grace', 92)
    const p = getProgress()
    expect(p.practiced).toEqual(['piano:amazing-grace'])
    expect(p.bestBpm['piano:amazing-grace']).toBe(92)
    expect(p.lastPracticed['piano:amazing-grace']).toBe(todayKey())
  })

  it('keeps subjects with the same slug separate', () => {
    recordPractice('piano:intervall-2', 80)
    recordPractice('gehor:intervall-2', 100)
    const p = getProgress()
    expect(p.practiced).toContain('piano:intervall-2')
    expect(p.practiced).toContain('gehor:intervall-2')
    expect(p.bestBpm['piano:intervall-2']).toBe(80)
    expect(p.bestBpm['gehor:intervall-2']).toBe(100)
  })

  it('only raises bestBpm on a new fastest', () => {
    recordPractice('piano:song', 90)
    recordPractice('piano:song', 70)
    expect(getProgress().bestBpm['piano:song']).toBe(90)
    recordPractice('piano:song', 110)
    expect(getProgress().bestBpm['piano:song']).toBe(110)
  })

  it('tracks per-section progress under the prefixed section key', () => {
    recordPractice('piano:song', 88, 'vers-1')
    const p = getProgress()
    const k = sectionKey('piano:song', 'vers-1')
    expect(k).toBe('piano:song#vers-1')
    expect(p.sectionPracticed).toContain(k)
    expect(p.sectionBestBpm[k]).toBe(88)
  })
})

describe('progress — legacy migrate-on-read', () => {
  it('reads bare pre-v2 slugs as piano:', () => {
    installStorage({
      practiced: ['amazing-grace'],
      bestBpm: { 'amazing-grace': 96 },
      lastPracticed: { 'amazing-grace': '2026-01-01' },
      sectionPracticed: ['amazing-grace#vers-1'],
      sectionBestBpm: { 'amazing-grace#vers-1': 84 },
    })
    const p = getProgress()
    expect(p.practiced).toEqual(['piano:amazing-grace'])
    expect(p.bestBpm).toEqual({ 'piano:amazing-grace': 96 })
    expect(p.lastPracticed).toEqual({ 'piano:amazing-grace': '2026-01-01' })
    expect(p.sectionPracticed).toEqual(['piano:amazing-grace#vers-1'])
    expect(p.sectionBestBpm).toEqual({ 'piano:amazing-grace#vers-1': 84 })
  })

  it('leaves already-prefixed keys untouched', () => {
    installStorage({
      practiced: ['gehor:intervall-2'],
      bestBpm: { 'gehor:intervall-2': 100 },
      sectionBestBpm: { 'gehor:intervall-2#a': 50 },
    })
    const p = getProgress()
    expect(p.practiced).toEqual(['gehor:intervall-2'])
    expect(p.bestBpm).toEqual({ 'gehor:intervall-2': 100 })
    expect(p.sectionBestBpm).toEqual({ 'gehor:intervall-2#a': 50 })
  })

  it('migrates a mixed (legacy + prefixed) store without collision', () => {
    installStorage({
      practiced: ['amazing-grace', 'piano:be-thou'],
      bestBpm: { 'amazing-grace': 90, 'piano:be-thou': 70 },
    })
    const p = getProgress()
    expect(p.practiced.sort()).toEqual(['piano:amazing-grace', 'piano:be-thou'])
    expect(p.bestBpm).toEqual({ 'piano:amazing-grace': 90, 'piano:be-thou': 70 })
  })

  it('does not write a bulk migration — the store is only rewritten on next practice', () => {
    const map = installStorage({ practiced: ['amazing-grace'], bestBpm: { 'amazing-grace': 90 } })
    getProgress()
    // Reading alone leaves the raw store bare (no prefix persisted yet).
    expect(JSON.parse(map.get(STORE_KEY)!).practiced).toEqual(['amazing-grace'])
    // Practising rewrites it in the new prefixed shape.
    recordPractice('piano:amazing-grace', 95)
    expect(JSON.parse(map.get(STORE_KEY)!).practiced).toEqual(['piano:amazing-grace'])
  })
})
