// ── Nåværende kirkeårs-periode (pragmatisk dato-mapping) ─────────────────────
// Maps a calendar date to one of the church-year seasons in kirkearet.ts, for
// the homepage "kirkeårs-hint" banner. This is a PURE, SSR-safe helper: no
// imports, no I/O — just month/day → season id, so it is trivially unit-tested.
//
// ── Forenklinger (viktig!) ────────────────────────────────────────────────────
// The real church year hangs off Easter, which moves every year (late March to
// late April), so exact boundaries for fastetiden / påske / pinse are impossible
// with a fixed table. We use fixed, approximate ("ca.") date bands aligned to a
// typical year (Easter placed ~mid-April) and map to the NINE broad periods a
// visitor experiences as "the current season". The three single-day/sub-periods
// that always fall INSIDE a broad band — Kristi himmelfartsdag (in påsketiden),
// høsttakkefest and allehelgensdag (in treenighetstiden) — are intentionally not
// returned; the surrounding broad season is shown instead. The UI labels the
// hint softly ("Nå er det …") so the approximation never reads as a hard claim.

/** The season ids current-season resolves to — a subset of kirkeårets ids. */
export type CurrentSeasonId =
  | 'advent'
  | 'jul'
  | 'apenbaringstiden'
  | 'fastetiden'
  | 'stille-uke'
  | 'paske'
  | 'pinse'
  | 'treenighetstiden'
  | 'domssondag'

// Upper bounds as month*100+day, in ascending order. The first band whose upper
// bound is >= the date's md wins. Juletiden wraps the new year, so it appears at
// both the start (Jan 1–5) and the end (Dec 25–31) of the table.
const BANDS: { maxMd: number; id: CurrentSeasonId }[] = [
  { maxMd: 105, id: 'jul' }, //               Jan 1  – Jan 5
  { maxMd: 217, id: 'apenbaringstiden' }, //  Jan 6  – Feb 17   (ca.)
  { maxMd: 405, id: 'fastetiden' }, //        Feb 18 – Apr 5    (ca.)
  { maxMd: 412, id: 'stille-uke' }, //        Apr 6  – Apr 12   (ca.)
  { maxMd: 531, id: 'paske' }, //             Apr 13 – May 31   (ca., incl. himmelfart)
  { maxMd: 607, id: 'pinse' }, //             Jun 1  – Jun 7    (ca.)
  { maxMd: 1123, id: 'treenighetstiden' }, // Jun 8  – Nov 23   (ca., incl. høsttakkefest/allehelgen)
  { maxMd: 1129, id: 'domssondag' }, //       Nov 24 – Nov 29   (ca.)
  { maxMd: 1224, id: 'advent' }, //           Nov 30 – Dec 24   (ca.)
  { maxMd: 1231, id: 'jul' }, //              Dec 25 – Dec 31
]

/** The current church-year season id for a date (defaults to now). Pure. */
export function currentSeasonId(date: Date = new Date()): CurrentSeasonId {
  const md = (date.getMonth() + 1) * 100 + date.getDate()
  for (const band of BANDS) {
    if (md <= band.maxMd) return band.id
  }
  // md > 1231 is impossible, but keep the function total.
  return 'jul'
}
