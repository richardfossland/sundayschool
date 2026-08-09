// ── «Fortsett der du slapp» — progress key → link (pure) ─────────────────────
//
// One progress key is all the store remembers about a practice session, so this
// module is the ONE place that knows how to read a key back into a card: which
// fag it belongs to, what to call it, and where it links. Every fag that writes
// progress must have a branch here — a missing branch is invisible (the key just
// silently never surfaces), which is exactly how rytme, bladspill, lovsang and
// lydteknikk went missing from the front page.
//
// Kept pure (no React, no localStorage) so every key shape is unit-tested
// against the strings the writers actually produce.

import type { Progress } from './progress'
import { SUBJECT_BY_ID, type SubjectId } from './subjects'

export interface ResolvedItem {
  key: string
  label: string
  sub: string
  href: string
  accent: string
  /** The last-practiced day ('YYYY-MM-DD'), for sorting. */
  date: string
}

/** Server-supplied name maps (the heavy data never crosses to the client). */
export interface ContinueTitles {
  songTitles: Record<string, string>
  grooveTitles: Record<string, string>
  lessonTitles: Record<string, string>
}

const GEHOR_TYPE_LABEL: Record<string, string> = {
  intervall: 'Intervaller',
  akkord: 'Akkordkvalitet',
  melodi: 'Melodidiktat',
}

const RYTME_TYPE_LABEL: Record<string, string> = {
  tapp: 'Rytmelesing',
  diktat: 'Rytmisk diktat',
}

const BLADSPILL_TYPE_LABEL: Record<string, string> = {
  nivaa: 'Fri lesing',
  vent: 'Vent-modus',
}

// The MIDI import lives only in the tab that made it (lib/midi-import mints an
// in-memory Song under this slug), so a card linking to it would always land on
// "finnes ikke". Progress is still recorded — it just can't be resumed.
const EPHEMERAL_SLUG = 'egen-midi'

/** Split a `{type}-{level}` tail into its parts. */
function splitLevel(rest: string): { type: string; level: string } {
  const dash = rest.lastIndexOf('-')
  if (dash === -1) return { type: rest, level: '' }
  return { type: rest.slice(0, dash), level: rest.slice(dash + 1) }
}

/**
 * Turn a subject-prefixed progress key into a display item, or null when the key
 * shape isn't one we can link back to.
 */
export function resolveProgressKey(
  key: string,
  date: string,
  titles: ContinueTitles,
): ResolvedItem | null {
  const colon = key.indexOf(':')
  if (colon === -1) return null
  const fag = key.slice(0, colon) as SubjectId
  const rest = key.slice(colon + 1)
  const subject = SUBJECT_BY_ID[fag]
  if (!subject) return null
  const accent = subject.accent
  const base = { key, accent, date }
  const { songTitles, grooveTitles, lessonTitles } = titles

  // Instrument songs: {fag}:{slug} → the fag's player for that song.
  if (fag === 'piano' || fag === 'gitar' || fag === 'bass') {
    if (rest === EPHEMERAL_SLUG) return null
    return { ...base, label: songTitles[rest] ?? rest, sub: subject.label, href: `/${fag}/sang/${rest}` }
  }

  if (fag === 'trommer') {
    // Two shapes: trommer:groove:{id} and trommer:{slug}.
    if (rest.startsWith('groove:')) {
      const id = rest.slice('groove:'.length)
      return { ...base, label: grooveTitles[id] ?? id, sub: 'Trommer · Groove', href: `/trommer/groove/${id}` }
    }
    if (rest === EPHEMERAL_SLUG) return null
    return { ...base, label: songTitles[rest] ?? rest, sub: 'Trommer', href: `/trommer/sang/${rest}` }
  }

  if (fag === 'gehor') {
    // gehor:{type}-{level}
    const { type, level } = splitLevel(rest)
    const typeLabel = GEHOR_TYPE_LABEL[type] ?? 'Gehør'
    return { ...base, label: typeLabel, sub: level ? `Gehør · Nivå ${level}` : 'Gehør', href: '/gehor' }
  }

  if (fag === 'rytme') {
    // rytme:tapp-{level} / rytme:diktat-{level}
    const { type, level } = splitLevel(rest)
    const typeLabel = RYTME_TYPE_LABEL[type] ?? 'Rytme'
    return { ...base, label: typeLabel, sub: level ? `Rytme · Nivå ${level}` : 'Rytme', href: '/rytme' }
  }

  if (fag === 'bladspill') {
    // bladspill:nivaa-{level} (fri lesing) / bladspill:vent-{level}
    const { type, level } = splitLevel(rest)
    const typeLabel = BLADSPILL_TYPE_LABEL[type] ?? 'Bladspill'
    return {
      ...base,
      label: typeLabel,
      sub: level ? `Bladspill · Nivå ${level}` : 'Bladspill',
      href: '/bladspill',
    }
  }

  if (fag === 'lovsang') {
    // lovsang:intro-{workSlug} — the setlist lives in localStorage, so we can
    // only link back to the fag front page, not to the specific list.
    if (!rest.startsWith('intro-')) return null
    const workSlug = rest.slice('intro-'.length)
    return {
      ...base,
      label: songTitles[workSlug] ?? 'Lovsang · intro',
      sub: 'Lovsang · Intro',
      href: '/lovsang',
    }
  }

  if (fag === 'lydteknikk') {
    return {
      ...base,
      label: lessonTitles[rest] ?? rest,
      sub: 'Lydteknikk',
      href: `/lydteknikk/${rest}`,
    }
  }

  if (fag === 'teologi') {
    return { ...base, label: 'Bibelvers', sub: 'Teologi', href: '/teologi/vers' }
  }

  return null
}

/**
 * The most recently practised items, newest first. Ties on the same day are
 * broken by position in `practiced` (later = added more recently).
 */
export function recentItems(
  progress: Progress,
  titles: ContinueTitles,
  limit = 3,
): ResolvedItem[] {
  const order = new Map(progress.practiced.map((k, i) => [k, i]))
  return Object.entries(progress.lastPracticed)
    .map(([key, date]) => resolveProgressKey(key, date, titles))
    .filter((r): r is ResolvedItem => r !== null)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return (order.get(b.key) ?? -1) - (order.get(a.key) ?? -1)
    })
    .slice(0, limit)
}
