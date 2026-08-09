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

import type { Mode } from '@/types/song'
import { pitchClass } from '../music'
import { chordSymbol, keyNameForTonic } from '../spelling'
import { circleIndex, relativeMajor } from '../theory/circle'

// ── Datamodell ───────────────────────────────────────────────────────────────

/** Ett innslag i en setliste: ett verk spilt i én måltoneart (pitch class 0–11). */
export interface SetlistEntry {
  /** Stabil identitet for lista i UI-et. Valgfri i FELTET fordi lister lagret
   * før dette fantes mangler den — `loadSetlists` fyller inn ved lesing, og
   * `addEntry` gir alltid nye innslag en id. */
  id?: string
  workSlug: string
  /** Måltoneart som pitch class 0–11 (0 = C). */
  targetKey: number
  /** Verkets modus. Uten den ville en mollsang bli behandlet som dur: a-moll
   * ved siden av C-dur er SAMME toneartsområde, men som durtonika ligger de tre
   * kvinter fra hverandre — altså «krevende overgang» der det i virkeligheten
   * ikke er noen. Valgfri av samme bakoverkompatible grunn som `id`;
   * `entryMode()` er den ene stedet defaulten 'major' bor. */
  mode?: Mode
}

/** Innslagets modus, med dur som default for eldre lagrede data. */
export function entryMode(entry: SetlistEntry): Mode {
  return entry.mode ?? 'major'
}

/**
 * Toneartens plass på kvintsirkelen: en molltoneart måles gjennom sin PARALLELLE
 * DUR (a-moll → C), fordi det er fortegnene — ikke grunntonen — som avgjør hvor
 * langt øret må flytte seg.
 */
export function tonalCenter(key: number, mode: Mode = 'major'): number {
  return mode === 'minor' ? relativeMajor(key) : pitchClass(key)
}

/** Lesbart toneartsnavn: 'G' for dur, 'a-moll' for moll (aldri bare 'a'). */
function keyLabel(pc: number, mode: Mode): string {
  const name = keyNameForTonic(pc, mode)
  return mode === 'minor' ? `${name}-moll` : name
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
 * grep for å ikke rykke øret ut av flyten. Moll måles gjennom parallell dur.
 */
export function keyFlowScore(
  fromKey: number,
  toKey: number,
  fromMode: Mode = 'major',
  toMode: Mode = 'major',
): { steps: number; rating: FlowRating } {
  const steps = circleDistance(tonalCenter(fromKey, fromMode), tonalCenter(toKey, toMode))
  const rating: FlowRating = steps <= 1 ? 'god' : steps === 2 ? 'ok' : 'krevende'
  return { steps, rating }
}

/**
 * 2–3 konkrete, spillbare råd for å binde `fromKey` til `toKey`. Akkordene
 * staves enharmonisk riktig i den nye tonearten, og i moll er trinn ii en
 * halvformindsket m7b5 — ikke en m7, som ville hørt fremmed ut mot mollskalaen.
 * Dominanten er V7 i begge modi (den hevede ledetonen er selve kadensen).
 */
export function transitionSuggestions(
  fromKey: number,
  toKey: number,
  toMode: Mode = 'major',
): string[] {
  const toSig = keyNameForTonic(toKey, toMode) // fortegn for staving ('Ab', 'a', …)
  const toName = keyLabel(toKey, toMode)

  if (fromKey === toKey) {
    const tonic = chordSymbol(toKey, toMode === 'minor' ? 'm' : '', toSig)
    return [`Samme toneart (${toName}) — hold flyten med et kort mellomspill på ${tonic}, uten å bytte.`]
  }

  const dominant = chordSymbol(pitchClass(toKey + 7), '7', toSig) // V7 i ny toneart
  const supertonic = chordSymbol(
    pitchClass(toKey + 2),
    toMode === 'minor' ? 'm7b5' : 'm7',
    toSig,
  ) // ii i ny toneart
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
  fromMode: Mode
  toKey: number
  toMode: Mode
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
    const fromMode = entryMode(entries[i])
    const toMode = entryMode(entries[i + 1])
    const { steps, rating } = keyFlowScore(fromKey, toKey, fromMode, toMode)
    perTransition.push({
      fromIndex: i,
      fromKey,
      fromMode,
      toKey,
      toMode,
      steps,
      rating,
      suggestions: transitionSuggestions(fromKey, toKey, toMode),
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

/** Legg til et innslag på slutten av lista. Innslaget får en stabil id her —
 * ikke i UI-et — så React-nøkler overlever omorganisering (en indeksnøkkel
 * remonterer alt under et innslag som flyttes, og river avspillingen med seg).
 * Modus følger verket, med dur som default. */
export function addEntry(entries: SetlistEntry[], entry: SetlistEntry): SetlistEntry[] {
  return [
    ...entries,
    { ...entry, id: entry.id ?? newEntryId(), mode: entryMode(entry) },
  ]
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

let entryCounter = 0
function newEntryId(now: number = Date.now()): string {
  return `se_${now.toString(36)}_${(entryCounter++).toString(36)}`
}

/** Fyll inn felter eldre lagrede innslag mangler (id, modus). Ids utledes av
 * liste-id + posisjon, så de er stabile på tvers av lesinger. */
function normalizeEntries(listId: string, entries: SetlistEntry[]): SetlistEntry[] {
  return entries.map((e, i) => ({ ...e, id: e.id ?? `${listId}_${i}`, mode: entryMode(e) }))
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
    return arr
      .filter(isSetlist)
      .map((l) => ({ ...l, entries: normalizeEntries(l.id, l.entries) }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
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
