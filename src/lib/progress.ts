// Local, per-device practice progress (no auth). Ported from SundayLicks and
// extended with per-section tracking. We record:
//   - which songs have been practiced (by slug)
//   - best (fastest) BPM reached per song
//   - the LOCAL date each song was last practiced (for streaks / Dagens økt)
//   - the same two, keyed per SECTION as `slug#sectionId`, so a learner can see
//     "Vers 1 mastered at 96 BPM" independently of the rest of the song.
// Stored in localStorage under one JSON key.

const KEY = 'sundayschool_progress'

export interface Progress {
  practiced: string[] // slugs
  bestBpm: Record<string, number> // slug → fastest BPM played
  /** slug → LOCAL 'YYYY-MM-DD' the song was most recently practiced. */
  lastPracticed: Record<string, string>
  sectionPracticed: string[] // 'slug#sectionId'
  sectionBestBpm: Record<string, number> // 'slug#sectionId' → fastest BPM
}

const EMPTY: Progress = {
  practiced: [],
  bestBpm: {},
  lastPracticed: {},
  sectionPracticed: [],
  sectionBestBpm: {},
}

/** Composite key for per-section progress. */
export function sectionKey(slug: string, sectionId: string): string {
  return `${slug}#${sectionId}`
}

/** Today's LOCAL date as 'YYYY-MM-DD'. Uses local calendar parts on purpose —
 * `toISOString()` is UTC and would roll the day over at the wrong moment in
 * Norway (e.g. 22:00 local becomes the next day). */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getProgress(): Progress {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const p = JSON.parse(raw) as Partial<Progress>
    return {
      practiced: p.practiced ?? [],
      bestBpm: p.bestBpm ?? {},
      lastPracticed: p.lastPracticed ?? {},
      sectionPracticed: p.sectionPracticed ?? [],
      sectionBestBpm: p.sectionBestBpm ?? {},
    }
  } catch {
    return EMPTY
  }
}

function save(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* storage full / blocked — ignore */
  }
}

/** Mark a song (and optionally one section) as practiced, record the BPM if it's
 * a new best, and stamp today's local date as the last-practiced day. Pass a
 * `sectionId` when practising a single section so its own best BPM is tracked. */
export function recordPractice(slug: string, bpm: number, sectionId?: string): Progress {
  const p = getProgress()
  if (!p.practiced.includes(slug)) p.practiced = [...p.practiced, slug]
  if (!p.bestBpm[slug] || bpm > p.bestBpm[slug]) p.bestBpm[slug] = bpm
  p.lastPracticed = { ...p.lastPracticed, [slug]: todayKey() }

  if (sectionId) {
    const k = sectionKey(slug, sectionId)
    if (!p.sectionPracticed.includes(k)) p.sectionPracticed = [...p.sectionPracticed, k]
    if (!p.sectionBestBpm[k] || bpm > p.sectionBestBpm[k]) p.sectionBestBpm[k] = bpm
  }

  save(p)
  return p
}
