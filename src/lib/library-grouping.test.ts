import { describe, it, expect } from 'vitest'
import type { SongMeta } from '@/types/song'
import {
  groupWorks,
  filterWorks,
  availableCategories,
  normalize,
  CATEGORIES,
} from './library-grouping'

// The library view groups arrangements into works and filters them. These are
// the invariants the UI relies on: one card per work_slug, variants ordered as
// a level picker, and search/category/tradition/level filtering that works on
// the grouped shape (a work matches a level if it HAS a variant there).

// Minimal SongMeta factory — only the fields grouping/filtering reads matter.
function meta(over: Partial<SongMeta> & Pick<SongMeta, 'slug' | 'work_slug'>): SongMeta {
  return {
    id: `seed:${over.slug}`,
    title: 'Tittel',
    subtitle: null,
    variant_label: null,
    tradition: 'hymne',
    difficulty: 1,
    original_key: 0,
    mode: 'major',
    default_bpm: 90,
    arrangement_style: 'enkel',
    rights: {
      publicDomain: true,
      creators: [],
      sources: [],
      verifiedAt: '2026-01-01',
    },
    tags: [],
    status: 'published',
    ...over,
  }
}

// A work with three variants (Enkel/Firstemmig/Gospel), deliberately supplied
// out of difficulty order to prove the sort.
const graceGospel = meta({
  slug: 'amazing-grace-gospel',
  work_slug: 'amazing-grace',
  title: 'Amazing Grace',
  subtitle: 'How sweet the sound',
  variant_label: 'Gospel',
  difficulty: 3,
  tags: ['klassiker', 'engelsk', 'utvidet'],
})
const graceEnkel = meta({
  slug: 'amazing-grace',
  work_slug: 'amazing-grace',
  title: 'Amazing Grace',
  subtitle: 'How sweet the sound',
  variant_label: 'Enkel',
  difficulty: 1,
  tags: ['klassiker', 'engelsk'],
})
const graceFirstemmig = meta({
  slug: 'amazing-grace-firstemmig',
  work_slug: 'amazing-grace',
  title: 'Amazing Grace',
  subtitle: 'How sweet the sound',
  variant_label: 'Firstemmig',
  difficulty: 2,
  tags: ['klassiker', 'engelsk'],
})
// A single-variant work.
const swingLow = meta({
  slug: 'swing-low',
  work_slug: 'swing-low',
  title: 'Swing Low, Sweet Chariot',
  tradition: 'spiritual',
  variant_label: null,
  difficulty: 1,
  tags: ['spiritual', 'rolig'],
})
// A single-variant work whose only arrangement is level 2 (like joyful-joyful).
const paske = meta({
  slug: 'paskemorgen',
  work_slug: 'paskemorgen',
  title: 'Påskemorgen slukker sorgen',
  tradition: 'salme',
  variant_label: null,
  difficulty: 2,
  tags: ['norsk', 'påske'],
})

const dataset = [graceGospel, swingLow, graceEnkel, paske, graceFirstemmig]

describe('groupWorks', () => {
  it('folds variants of the same work_slug into one group', () => {
    const groups = groupWorks(dataset)
    expect(groups).toHaveLength(3) // amazing-grace, swing-low, paskemorgen
    const grace = groups.find((g) => g.work_slug === 'amazing-grace')!
    expect(grace.variants).toHaveLength(3)
  })

  it('sorts variants by difficulty ascending (level picker order)', () => {
    const grace = groupWorks(dataset).find((g) => g.work_slug === 'amazing-grace')!
    expect(grace.variants.map((v) => v.variant_label)).toEqual(['Enkel', 'Firstemmig', 'Gospel'])
    expect(grace.variants.map((v) => v.difficulty)).toEqual([1, 2, 3])
    expect(grace.difficulties).toEqual([1, 2, 3])
  })

  it('takes representative fields from the lowest-difficulty variant', () => {
    const grace = groupWorks(dataset).find((g) => g.work_slug === 'amazing-grace')!
    expect(grace.title).toBe('Amazing Grace')
    expect(grace.subtitle).toBe('How sweet the sound')
    expect(grace.tradition).toBe('hymne')
  })

  it('unions tags across all variants', () => {
    const grace = groupWorks(dataset).find((g) => g.work_slug === 'amazing-grace')!
    expect(grace.tags).toContain('utvidet') // only on the gospel variant
    expect(grace.tags.filter((t) => t === 'klassiker')).toHaveLength(1) // de-duped
  })

  it('sorts groups alphabetically by title', () => {
    const titles = groupWorks(dataset).map((g) => g.title)
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'nb')))
    expect(titles[0]).toBe('Amazing Grace')
  })

  it('keeps a single-variant work as one variant with a null label', () => {
    const swing = groupWorks(dataset).find((g) => g.work_slug === 'swing-low')!
    expect(swing.variants).toHaveLength(1)
    expect(swing.variants[0].variant_label).toBeNull()
  })
})

describe('normalize', () => {
  it('lowercases and trims but keeps æøå', () => {
    expect(normalize('  PÅSKEmorgen ')).toBe('påskemorgen')
    expect(normalize('Kjærlighet')).toBe('kjærlighet')
  })
})

describe('filterWorks', () => {
  const groups = groupWorks(dataset)

  it('returns everything with no filter', () => {
    expect(filterWorks(groups)).toHaveLength(3)
  })

  it('matches query on title (normalised)', () => {
    const res = filterWorks(groups, { query: 'amazing' })
    expect(res.map((g) => g.work_slug)).toEqual(['amazing-grace'])
  })

  it('matches query on subtitle and tags', () => {
    expect(filterWorks(groups, { query: 'the sound' }).map((g) => g.work_slug)).toEqual([
      'amazing-grace',
    ])
    // 'utvidet' lives only on the gospel variant but is unioned into the work.
    expect(filterWorks(groups, { query: 'utvidet' }).map((g) => g.work_slug)).toEqual([
      'amazing-grace',
    ])
  })

  it('query matching is case/whitespace/æøå insensitive', () => {
    expect(filterWorks(groups, { query: '  PÅSKE ' }).map((g) => g.work_slug)).toEqual([
      'paskemorgen',
    ])
  })

  it('filters by category (tag)', () => {
    expect(filterWorks(groups, { category: 'påske' }).map((g) => g.work_slug)).toEqual([
      'paskemorgen',
    ])
    expect(filterWorks(groups, { category: 'klassiker' }).map((g) => g.work_slug)).toEqual([
      'amazing-grace',
    ])
  })

  it('filters by tradition', () => {
    expect(filterWorks(groups, { tradition: 'spiritual' }).map((g) => g.work_slug)).toEqual([
      'swing-low',
    ])
    expect(filterWorks(groups, { tradition: 'all' })).toHaveLength(3)
  })

  it('shows a work when it HAS a variant at the level', () => {
    // Level 3 only exists on Amazing Grace (gospel variant).
    expect(filterWorks(groups, { difficulty: 3 }).map((g) => g.work_slug)).toEqual(['amazing-grace'])
    // Level 2 exists on Amazing Grace (firstemmig) AND Påskemorgen (its only level).
    expect(filterWorks(groups, { difficulty: 2 }).map((g) => g.work_slug).sort()).toEqual([
      'amazing-grace',
      'paskemorgen',
    ])
    // Level 1 has no variant on Påskemorgen → it drops out.
    expect(filterWorks(groups, { difficulty: 1 }).map((g) => g.work_slug).sort()).toEqual([
      'amazing-grace',
      'swing-low',
    ])
  })

  it('combines filters (AND)', () => {
    expect(
      filterWorks(groups, { tradition: 'hymne', difficulty: 3, query: 'grace' }).map(
        (g) => g.work_slug,
      ),
    ).toEqual(['amazing-grace'])
    expect(filterWorks(groups, { tradition: 'salme', difficulty: 1 })).toHaveLength(0)
  })
})

describe('availableCategories', () => {
  it('returns only categories present in the dataset, in CATEGORIES order', () => {
    const avail = availableCategories(groupWorks(dataset))
    const ids = avail.map((c) => c.id)
    expect(ids).toContain('påske')
    expect(ids).toContain('norsk')
    expect(ids).toContain('spiritual')
    expect(ids).toContain('klassiker')
    expect(ids).not.toContain('jul') // no jul-tagged work here
    expect(ids).not.toContain('gospel')
    // order matches the curated CATEGORIES ordering
    const order = CATEGORIES.map((c) => c.id).filter((id) => ids.includes(id))
    expect(ids).toEqual(order)
  })
})
