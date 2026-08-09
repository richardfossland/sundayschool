// Local, per-device practice progress (no auth). Ported from SundayLicks and
// extended with per-section tracking. We record:
//   - which songs have been practiced (by subject-prefixed key)
//   - best (fastest) BPM reached per song
//   - the LOCAL date each song was last practiced (for streaks / Dagens økt)
//   - the same two, keyed per SECTION as `key#sectionId`, so a learner can see
//     "Vers 1 mastered at 96 BPM" independently of the rest of the song.
// Stored in localStorage under one JSON key.
//
// ── Subject prefix (Skolen v2) ────────────────────────────────────────────────
// Keys are now `{fag}:{slug}` (e.g. `piano:amazing-grace`, `gehor:intervall-2`)
// so a single progress store can span every subject in the school. Callers pass
// the already-prefixed key. Pre-v2 stores held bare slugs (`amazing-grace`);
// those are read as `piano:` on load (migrate-on-read — we do NOT run a bulk
// write migration; a legacy store is only rewritten with prefixes the next time
// that song is practiced).

const KEY = 'sundayschool_progress'

export interface Progress {
  practiced: string[] // subject-prefixed keys
  bestBpm: Record<string, number> // key → fastest BPM played
  /** key → LOCAL 'YYYY-MM-DD' the song was most recently practiced. */
  lastPracticed: Record<string, string>
  sectionPracticed: string[] // 'key#sectionId'
  sectionBestBpm: Record<string, number> // 'key#sectionId' → fastest BPM
}

const EMPTY: Progress = {
  practiced: [],
  bestBpm: {},
  lastPracticed: {},
  sectionPracticed: [],
  sectionBestBpm: {},
}

/** Composite key for per-section progress. `key` is already subject-prefixed. */
export function sectionKey(key: string, sectionId: string): string {
  return `${key}#${sectionId}`
}

/** Migrate a legacy (unprefixed) key to `piano:`. A key is considered already
 * prefixed if its base (the part before any `#sectionId`) contains a ':'. New
 * keys pass through untouched. */
function migrateKey(k: string): string {
  const hashAt = k.indexOf('#')
  const base = hashAt === -1 ? k : k.slice(0, hashAt)
  if (base.includes(':')) return k
  return `piano:${k}`
}

function migrateList(list: string[]): string[] {
  return list.map(migrateKey)
}

function migrateRecord<T>(rec: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [k, v] of Object.entries(rec)) out[migrateKey(k)] = v
  return out
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
    // Migrate-on-read: bare pre-v2 keys are interpreted as `piano:`.
    return {
      practiced: migrateList(p.practiced ?? []),
      bestBpm: migrateRecord(p.bestBpm ?? {}),
      lastPracticed: migrateRecord(p.lastPracticed ?? {}),
      sectionPracticed: migrateList(p.sectionPracticed ?? []),
      sectionBestBpm: migrateRecord(p.sectionBestBpm ?? {}),
    }
  } catch {
    return EMPTY
  }
}

/** Write the store. Returns false when the write was refused (private mode,
 * full storage, blocked cookies) so callers can tell the learner instead of
 * losing their progress in silence. */
function save(p: Progress): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
    return true
  } catch {
    return false
  }
}

/** Mark a song (and optionally one section) as practiced, record the BPM if it's
 * a new best, and stamp today's local date as the last-practiced day. `key` is
 * the subject-prefixed key (e.g. `piano:amazing-grace`). Pass a `sectionId` when
 * practising a single section so its own best BPM is tracked. */
export function recordPractice(key: string, bpm: number, sectionId?: string): Progress {
  const p = getProgress()
  if (!p.practiced.includes(key)) p.practiced = [...p.practiced, key]
  if (!p.bestBpm[key] || bpm > p.bestBpm[key]) p.bestBpm[key] = bpm
  p.lastPracticed = { ...p.lastPracticed, [key]: todayKey() }

  if (sectionId) {
    const k = sectionKey(key, sectionId)
    if (!p.sectionPracticed.includes(k)) p.sectionPracticed = [...p.sectionPracticed, k]
    if (!p.sectionBestBpm[k] || bpm > p.sectionBestBpm[k]) p.sectionBestBpm[k] = bpm
  }

  save(p)
  return p
}
