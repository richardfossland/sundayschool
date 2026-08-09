import { describe, expect, it } from 'vitest'
import { recentItems, resolveProgressKey, type ContinueTitles } from './continue-resolve'
import type { Progress } from './progress'

const titles: ContinueTitles = {
  songTitles: { 'amazing-grace': 'Amazing Grace', 'kumbaya': 'Kumbaya' },
  grooveTitles: { 'rock-8': 'Rock 8-dels' },
  lessonTitles: { eq: 'EQ — å forme lyden' },
}

const D = '2026-08-08'
const r = (key: string) => resolveProgressKey(key, D, titles)

describe('resolveProgressKey — instrument songs', () => {
  it('links each instrument fag to its own player', () => {
    expect(r('piano:amazing-grace')).toMatchObject({
      label: 'Amazing Grace',
      href: '/piano/sang/amazing-grace',
    })
    expect(r('gitar:kumbaya')).toMatchObject({ href: '/gitar/sang/kumbaya' })
    expect(r('bass:kumbaya')).toMatchObject({ href: '/bass/sang/kumbaya' })
    expect(r('trommer:kumbaya')).toMatchObject({ href: '/trommer/sang/kumbaya', sub: 'Trommer' })
  })

  it('falls back to the slug for an unknown title', () => {
    expect(r('piano:ukjent-sang')).toMatchObject({ label: 'ukjent-sang' })
  })

  it('drops the in-memory MIDI import — it cannot be linked back to', () => {
    expect(r('piano:egen-midi')).toBeNull()
    expect(r('gitar:egen-midi')).toBeNull()
    expect(r('trommer:egen-midi')).toBeNull()
  })

  it('links a groove by its own shape', () => {
    expect(r('trommer:groove:rock-8')).toMatchObject({
      label: 'Rock 8-dels',
      sub: 'Trommer · Groove',
      href: '/trommer/groove/rock-8',
    })
  })
})

describe('resolveProgressKey — the øvings-fag', () => {
  it('resolves gehør levels', () => {
    expect(r('gehor:intervall-2')).toMatchObject({
      label: 'Intervaller',
      sub: 'Gehør · Nivå 2',
      href: '/gehor',
    })
  })

  it('resolves both rytme shapes', () => {
    expect(r('rytme:tapp-1')).toMatchObject({
      label: 'Rytmelesing',
      sub: 'Rytme · Nivå 1',
      href: '/rytme',
    })
    expect(r('rytme:diktat-3')).toMatchObject({ label: 'Rytmisk diktat', sub: 'Rytme · Nivå 3' })
  })

  it('resolves both bladspill shapes', () => {
    expect(r('bladspill:nivaa-2')).toMatchObject({
      label: 'Fri lesing',
      sub: 'Bladspill · Nivå 2',
      href: '/bladspill',
    })
    expect(r('bladspill:vent-2')).toMatchObject({ label: 'Vent-modus', sub: 'Bladspill · Nivå 2' })
  })

  it('resolves a lovsang intro, naming the work when known', () => {
    expect(r('lovsang:intro-amazing-grace')).toMatchObject({
      label: 'Amazing Grace',
      sub: 'Lovsang · Intro',
      href: '/lovsang',
    })
    expect(r('lovsang:intro-ukjent')).toMatchObject({ label: 'Lovsang · intro' })
  })

  it('links a lydteknikk lesson to its own page', () => {
    expect(r('lydteknikk:eq')).toMatchObject({
      label: 'EQ — å forme lyden',
      sub: 'Lydteknikk',
      href: '/lydteknikk/eq',
    })
  })

  it('resolves teologi', () => {
    expect(r('teologi:vers')).toMatchObject({ label: 'Bibelvers', href: '/teologi/vers' })
  })
})

describe('resolveProgressKey — non-keys', () => {
  it('returns null for an unprefixed or unknown-fag key', () => {
    expect(r('amazing-grace')).toBeNull() // legacy bare slug
    expect(r('finnesikke:noe')).toBeNull()
    expect(r('lovsang:noe-annet')).toBeNull() // not an intro key
  })

  it('carries the fag accent and the date through', () => {
    const item = r('piano:kumbaya')!
    expect(item.accent).toBe('var(--fag-piano)')
    expect(item.date).toBe(D)
    expect(item.key).toBe('piano:kumbaya')
  })
})

describe('recentItems', () => {
  const progress = (p: Partial<Progress>): Progress => ({
    practiced: [],
    bestBpm: {},
    lastPracticed: {},
    sectionPracticed: [],
    sectionBestBpm: {},
    ...p,
  })

  it('sorts newest day first, then by recency within the day, capped at the limit', () => {
    const items = recentItems(
      progress({
        practiced: ['piano:kumbaya', 'rytme:tapp-1', 'gehor:intervall-2', 'teologi:vers'],
        lastPracticed: {
          'piano:kumbaya': '2026-08-01',
          'rytme:tapp-1': '2026-08-08',
          'gehor:intervall-2': '2026-08-08',
          'teologi:vers': '2026-08-08',
        },
      }),
      titles,
    )
    // Same day → later in `practiced` wins; older day drops off the 3-item list.
    expect(items.map((i) => i.key)).toEqual([
      'teologi:vers',
      'gehor:intervall-2',
      'rytme:tapp-1',
    ])
  })

  it('skips keys that cannot be linked instead of rendering a dead card', () => {
    const items = recentItems(
      progress({
        practiced: ['piano:egen-midi', 'piano:kumbaya'],
        lastPracticed: { 'piano:egen-midi': D, 'piano:kumbaya': D },
      }),
      titles,
    )
    expect(items.map((i) => i.key)).toEqual(['piano:kumbaya'])
  })
})
