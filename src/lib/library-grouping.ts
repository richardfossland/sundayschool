import type { SongMeta, Tradition, Difficulty, Mode } from '@/types/song'

// ── Library grouping + filtering (pure, no React) ────────────────────────────
// The song library grew past the point where one flat card per arrangement
// reads well: a single work (e.g. Amazing Grace) ships as several variants
// (Enkel / Firstemmig / Gospel) that share a `work_slug`. This module folds the
// flat SongMeta list into ONE group per work — with the variants sorted by
// difficulty as a level picker — and applies the library's search/category/
// tradition/level filters. Kept free of React/DOM so it is unit-testable in the
// node env (src/components has no test setup); SongLibraryList is a thin view
// over these two functions.

/** One playable arrangement inside a work group. */
export interface WorkVariant {
  slug: string
  /** 'Enkel' | 'Firstemmig' | 'Gospel' — or null when the work has a single
   * arrangement (then the whole card is the link, no picker chip). */
  variant_label: string | null
  difficulty: Difficulty
}

/** A work (one card): representative metadata + its variants as a level picker. */
export interface WorkGroup {
  work_slug: string
  /** Representative display fields, taken from the lowest-difficulty variant
   * (all variants of a work share title/subtitle/tradition/key). */
  title: string
  subtitle: string | null
  tradition: Tradition
  original_key: number
  mode: Mode
  /** The lowest-difficulty variant's tempo. Do NOT show this alone when
   * `bpmRange` is set — see below. */
  default_bpm: number
  /** [min, max] tempo across the variants, ONLY when they disagree (null when
   * every variant shares one tempo). Tempo is the one representative field that
   * genuinely differs between levels — Amazing Grace is 84 BPM enkel but 76
   * firstemmig — so quoting the lowest level's number as the work's tempo told
   * the reader something false about the arrangement they were about to open. */
  bpmRange: [number, number] | null
  /** Union of every variant's tags — used for search + category filtering so a
   * work matches if ANY of its arrangements carries the tag. */
  tags: string[]
  /** Sorted by difficulty ascending (Enkel → Firstemmig → Gospel). */
  variants: WorkVariant[]
  /** Distinct difficulties present, ascending — for the level filter. */
  difficulties: Difficulty[]
}

export interface LibraryFilter {
  /** Free-text query; matched (normalised) against title + subtitle + tags. */
  query?: string
  /** A category id from CATEGORIES ('jul', 'påske', …) → matches tags. */
  category?: string | null
  tradition?: Tradition | 'all'
  /** Show a work only if it has a variant at this level. */
  difficulty?: Difficulty | 'all'
}

/** Curated category chips. `id` is matched against a work's tags; `label` is the
 * Norwegian chip text. Only categories with matches in the dataset are shown
 * (see availableCategories). */
export const CATEGORIES: { id: string; label: string }[] = [
  { id: 'jul', label: 'Jul' },
  { id: 'påske', label: 'Påske' },
  { id: 'norsk', label: 'Norsk' },
  { id: 'spiritual', label: 'Spirituals' },
  { id: 'gospel', label: 'Gospel' },
  { id: 'klassiker', label: 'Klassikere' },
]

/** Normalise text for matching: lowercase + trim, æøå preserved (no diacritic
 * folding — Norwegian vowels are meaningful, not accents to strip). */
export function normalize(s: string): string {
  return s.toLowerCase().trim()
}

/** Fold the flat SongMeta list into one WorkGroup per `work_slug`. Variants are
 * sorted by difficulty (then slug for a stable tie-break); representative
 * display fields come from the lowest-difficulty variant. Groups are returned
 * sorted alphabetically by title (Norwegian collation). */
export function groupWorks(metas: SongMeta[]): WorkGroup[] {
  const byWork = new Map<string, SongMeta[]>()
  for (const m of metas) {
    const list = byWork.get(m.work_slug)
    if (list) list.push(m)
    else byWork.set(m.work_slug, [m])
  }

  const groups: WorkGroup[] = []
  for (const [work_slug, rows] of byWork) {
    const sorted = [...rows].sort((a, b) => a.difficulty - b.difficulty || a.slug.localeCompare(b.slug))
    const rep = sorted[0]
    const tags = [...new Set(sorted.flatMap((r) => r.tags))]
    const difficulties = [...new Set(sorted.map((r) => r.difficulty))].sort((a, b) => a - b)
    const bpms = sorted.map((r) => r.default_bpm)
    const bpmMin = Math.min(...bpms)
    const bpmMax = Math.max(...bpms)
    groups.push({
      work_slug,
      title: rep.title,
      subtitle: rep.subtitle,
      tradition: rep.tradition,
      original_key: rep.original_key,
      mode: rep.mode,
      default_bpm: rep.default_bpm,
      bpmRange: bpmMin === bpmMax ? null : [bpmMin, bpmMax],
      tags,
      variants: sorted.map((r) => ({
        slug: r.slug,
        variant_label: r.variant_label,
        difficulty: r.difficulty,
      })),
      difficulties,
    })
  }

  return groups.sort((a, b) => a.title.localeCompare(b.title, 'nb'))
}

/** Apply the library filters. Query matches title/subtitle/tags (normalised);
 * category matches tags; tradition matches exactly; difficulty keeps works that
 * HAVE a variant at that level. Input order is preserved (already alphabetical
 * from groupWorks). */
export function filterWorks(groups: WorkGroup[], filter: LibraryFilter = {}): WorkGroup[] {
  const q = filter.query ? normalize(filter.query) : ''
  const { category, tradition, difficulty } = filter

  return groups.filter((g) => {
    if (tradition && tradition !== 'all' && g.tradition !== tradition) return false
    if (category && !g.tags.includes(category)) return false
    if (difficulty && difficulty !== 'all' && !g.difficulties.includes(difficulty)) return false
    if (q) {
      const haystack = normalize([g.title, g.subtitle ?? '', ...g.tags].join(' '))
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

/** The subset of CATEGORIES that actually match at least one work — so the UI
 * never shows a dead chip. Order follows CATEGORIES. */
export function availableCategories(groups: WorkGroup[]): { id: string; label: string }[] {
  return CATEGORIES.filter((c) => groups.some((g) => g.tags.includes(c.id)))
}
