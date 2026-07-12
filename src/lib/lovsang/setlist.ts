// ── Setliste-verksted (pure + tynn localStorage-wrapper) ─────────────────────
//
// Lovsangsledere bygger søndagens setliste av verk fra sangbiblioteket, hvert
// med sin egen måltoneart. Denne modulen svarer på ETT spørsmål: hvor godt
// flyter setlista fra sang til sang? Flyten måles som kvintsirkel-avstand
// mellom nabotonearter (0 = samme toneart, 6 = tritonus unna), og hver overgang
// får konkrete, spillbare råd (felles dominant, ii–V, pad, modulasjon).
//
// All teori er ren og testbar. localStorage-laget er en tynn wrapper rundt de
// samme rene array-operasjonene, så lagring/lasting aldri gjemmer forretnings-
// logikk bak nettleser-API.

import { pitchClass } from '../music'
import { chordSymbol, keyNameForTonic } from '../spelling'
import { circleIndex } from '../theory/circle'

// ── Datamodell ───────────────────────────────────────────────────────────────

/** Ett innslag i en setliste: ett verk spilt i én måltoneart (pitch class 0–11). */
export interface SetlistEntry {
  workSlug: string
  /** Måltoneart som pitch class 0–11 (0 = C). */
  targetKey: number
}

/** En navngitt setliste, lagret per enhet i localStorage. */
export interface Setlist {
  id: string
  name: string
  entries: SetlistEntry[]
  /** Epoch-millisekunder for siste lagring (nyeste liste øverst). */
  updatedAt: number
}

export type FlowRating = 'god' | 'ok' | 'krevende'

// ── Kvintsirkel-flyt ─────────────────────────────────────────────────────────

/**
 * Avstanden mellom to tonearter langs kvintsirkelen (0–6). C→G = 1 (nabo),
 * C→F# = 6 (motsatt side). Retningen spiller ingen rolle — en overgang er like
 * lang begge veier.
 */
export function circleDistance(fromKey: number, toKey: number): number {
  const raw = Math.abs(circleIndex(fromKey) - circleIndex(toKey))
  return Math.min(raw, 12 - raw)
}

/**
 * Flyt-vurdering av én overgang: kvintsirkel-avstand + karakter. Nære tonearter
 * (≤1 steg) flyter godt, 2 steg er ok, 3+ er krevende og trenger et bevisst
 * grep for å ikke rykke øret ut av flyten.
 */
export function keyFlowScore(fromKey: number, toKey: number): { steps: number; rating: FlowRating } {
  const steps = circleDistance(fromKey, toKey)
  const rating: FlowRating = steps <= 1 ? 'god' : steps === 2 ? 'ok' : 'krevende'
  return { steps, rating }
}

/**
 * 2–3 konkrete, spillbare råd for å binde `fromKey` til `toKey`. Tonearter
 * navngis som dur (setlista lagrer bare pitch class), og akkordene staves
 * enharmonisk riktig i den nye tonearten.
 */
export function transitionSuggestions(fromKey: number, toKey: number): string[] {
  const toName = keyNameForTonic(toKey, 'major')

  if (fromKey === toKey) {
    const tonic = chordSymbol(toKey, '', toName)
    return [`Samme toneart (${toName}) — hold flyten med et kort mellomspill på ${tonic}, uten å bytte.`]
  }

  const dominant = chordSymbol(pitchClass(toKey + 7), '7', toName) // V7 i ny toneart
  const supertonic = chordSymbol(pitchClass(toKey + 2), 'm7', toName) // ii7 i ny toneart
  const out: string[] = [
    `Bruk ${dominant} (dominanten i ${toName}) som felles akkord — den leder øret rett inn i ${toName}.`,
    `Legg inn en ii–V: ${supertonic}–${dominant} de siste taktene før ${toName}.`,
  ]

  // Tredje råd: et lite trinn opp modulerer fint via dominanten; ellers en pad
  // som forbereder skiftet under siste refreng.
  const semisUp = pitchClass(toKey - fromKey)
  if (semisUp === 1 || semisUp === 2) {
    out.push(`Modulér opp ${semisUp} ${semisUp === 1 ? 'halvtone' : 'halvtoner'} via ${dominant}.`)
  } else {
    out.push(`Legg en pad på ${toName} under siste refreng for å myke opp skiftet.`)
  }
  return out
}

/** Full flyt-analyse av én overgang (indeks + tonearter + råd). */
export interface TransitionAnalysis {
  /** Indeksen til innslaget FØR overgangen (overgangen er i → i+1). */
  fromIndex: number
  fromKey: number
  toKey: number
  steps: number
  rating: FlowRating
  suggestions: string[]
}

/**
 * Analyser hele setlista: én oppføring per overgang, pluss en samlet vurdering
 * basert på gjennomsnittlig kvintsirkel-avstand. En tom liste (eller én sang)
 * har ingen overganger og flyter dermed trivielt godt.
 */
export function analyzeSetlist(entries: SetlistEntry[]): {
  perTransition: TransitionAnalysis[]
  totalRating: FlowRating
} {
  const perTransition: TransitionAnalysis[] = []
  for (let i = 0; i < entries.length - 1; i++) {
    const fromKey = entries[i].targetKey
    const toKey = entries[i + 1].targetKey
    const { steps, rating } = keyFlowScore(fromKey, toKey)
    perTransition.push({
      fromIndex: i,
      fromKey,
      toKey,
      steps,
      rating,
      suggestions: transitionSuggestions(fromKey, toKey),
    })
  }

  let totalRating: FlowRating = 'god'
  if (perTransition.length > 0) {
    const avg = perTransition.reduce((s, t) => s + t.steps, 0) / perTransition.length
    totalRating = avg <= 1 ? 'god' : avg <= 2 ? 'ok' : 'krevende'
  }
  return { perTransition, totalRating }
}

// ── Rene innslag-operasjoner (immutable) ─────────────────────────────────────

/** Legg til et innslag på slutten av lista. */
export function addEntry(entries: SetlistEntry[], entry: SetlistEntry): SetlistEntry[] {
  return [...entries, entry]
}

/** Fjern innslaget på `index` (out-of-range = uendret). */
export function removeEntryAt(entries: SetlistEntry[], index: number): SetlistEntry[] {
  if (index < 0 || index >= entries.length) return entries
  return entries.filter((_, i) => i !== index)
}

/** Flytt innslaget på `index` ett hakk opp (-1) eller ned (+1). */
export function moveEntry(entries: SetlistEntry[], index: number, dir: -1 | 1): SetlistEntry[] {
  const j = index + dir
  if (index < 0 || index >= entries.length || j < 0 || j >= entries.length) return entries
  const copy = [...entries]
  ;[copy[index], copy[j]] = [copy[j], copy[index]]
  return copy
}

/** Sett måltonearten (pitch class 0–11) for innslaget på `index`. */
export function setEntryKey(entries: SetlistEntry[], index: number, targetKey: number): SetlistEntry[] {
  if (index < 0 || index >= entries.length) return entries
  return entries.map((e, i) => (i === index ? { ...e, targetKey: pitchClass(targetKey) } : e))
}

// ── Rene setliste-operasjoner (immutable) ────────────────────────────────────

/** Lag en ny setliste (id + tidsstempel injiseres for testbarhet). */
export function createSetlist(
  name: string,
  entries: SetlistEntry[] = [],
  id?: string,
  now: number = Date.now(),
): Setlist {
  return { id: id ?? newSetlistId(now), name, entries, updatedAt: now }
}

/** Sett inn eller erstatt en setliste (matchet på id), nyeste øverst. */
export function upsertSetlist(lists: Setlist[], setlist: Setlist): Setlist[] {
  const rest = lists.filter((l) => l.id !== setlist.id)
  return [setlist, ...rest].sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Fjern en setliste på id. */
export function removeSetlist(lists: Setlist[], id: string): Setlist[] {
  return lists.filter((l) => l.id !== id)
}

// ── localStorage-lag (tynn wrapper rundt operasjonene over) ───────────────────

const KEY = 'sundayschool_setlists'

// Monotont stigende id uten Math.random (bannlyst i den testbare kjernen). To
// lister laget i samme millisekund skilles av telleren.
let idCounter = 0
function newSetlistId(now: number = Date.now()): string {
  return `sl_${now.toString(36)}_${(idCounter++).toString(36)}`
}

function isSetlist(v: unknown): v is Setlist {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.updatedAt === 'number' &&
    Array.isArray(o.entries) &&
    o.entries.every(
      (e) =>
        e &&
        typeof e === 'object' &&
        typeof (e as SetlistEntry).workSlug === 'string' &&
        typeof (e as SetlistEntry).targetKey === 'number',
    )
  )
}

/** Alle lagrede setlister, nyeste øverst (tom liste utenfor nettleseren). */
export function loadSetlists(): Setlist[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter(isSetlist).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

function persist(lists: Setlist[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lists))
  } catch {
    /* full/blokkert lager — ignorer */
  }
}

/** Lagre (sett inn/erstatt) en setliste med ferskt tidsstempel. Returnerer hele
 * det oppdaterte settet. */
export function saveSetlist(setlist: Setlist): Setlist[] {
  const stamped: Setlist = { ...setlist, updatedAt: Date.now() }
  const next = upsertSetlist(loadSetlists(), stamped)
  persist(next)
  return next
}

/** Slett en setliste på id. Returnerer hele det oppdaterte settet. */
export function deleteSetlist(id: string): Setlist[] {
  const next = removeSetlist(loadSetlists(), id)
  persist(next)
  return next
}
