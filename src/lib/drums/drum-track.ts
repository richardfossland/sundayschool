import type { SongDoc } from '@/types/song'
import type { EngineEvent } from '../engine-events'
import type { DrumHit, Groove } from './types'
import { GROOVES, FILLS } from '@/data/grooves'

// ── Drum-track generator (pure) ───────────────────────────────────────────────
// Turns a song's SongDoc into a full drum accompaniment by tiling a groove:
//
//  • Groove choice: an explicit `style` override wins; otherwise the song's
//    time signature narrows the candidates and the tempo picks among them
//    (slow 4/4 → ballade, mid → gospel-8ths, fast → shout). Meters we have no
//    groove for fall back to a synthesised basic beat, so generation never fails.
//  • Pickup (opptakt): drums REST through the pickup — tiling starts at the
//    first full bar (t = pickupBeats), which is how a band actually treats an
//    anacrusis.
//  • Section boundaries: the last bar before each internal boundary is swapped
//    for a one-bar fill (from data/grooves/fills for 4/4; synthesised for other
//    meters), and the boundary downbeat gets a crash (replacing any hi-hat/ride
//    scheduled on that exact beat so the cymbals don't stack).

const EPS = 1e-6

const KICK = 36
const SNARE = 38
const HIHAT = 42
const OPEN_HIHAT = 46
const CRASH = 49
const RIDE = 51

export interface GenerateOptions {
  /** Explicit groove override — matches Groove.style or Groove.id. */
  style?: string
  /** Song tempo, used to pick a groove that suits the feel. */
  bpm?: number
}

/** A minimal synthesised beat for meters the library has no groove for:
 * kick on 1, hi-hat on every beat, backbeat when the bar has 4+ beats. */
function basicGroove(beatsPerBar: number): DrumHit[] {
  const hits: DrumHit[] = [{ t: 0, p: KICK, v: 0.8 }]
  for (let b = 0; b < beatsPerBar; b++) hits.push({ t: b, p: HIHAT, v: 0.5 })
  if (beatsPerBar >= 4) {
    for (let b = 1; b < beatsPerBar; b += 2) hits.push({ t: b, p: SNARE, v: 0.8 })
  }
  return hits.sort((a, b) => a.t - b.t || a.p - b.p)
}

/** A synthesised one-bar fill for non-4/4 meters: keep the downbeat kick, then
 * snare eighths through the last beat rising into the boundary. */
function basicFill(beatsPerBar: number): DrumHit[] {
  const hits: DrumHit[] = [{ t: 0, p: KICK, v: 0.8 }]
  for (let b = 0; b < beatsPerBar - 1; b++) hits.push({ t: b, p: HIHAT, v: 0.5 })
  hits.push({ t: beatsPerBar - 1, p: SNARE, v: 0.7 })
  hits.push({ t: beatsPerBar - 0.5, p: SNARE, v: 0.85 })
  return hits
}

/**
 * Pick the groove for a song. Explicit `style` (matching Groove.style or id)
 * wins; otherwise match the time signature and let the tempo choose the feel.
 * Returns null when only the synthesised fallback fits.
 */
export function pickGroove(doc: Pick<SongDoc, 'timeSignature' | 'beatsPerBar'>, opts: GenerateOptions = {}): Groove | null {
  if (opts.style) {
    const g = GROOVES.find((g) => g.style === opts.style || g.id === opts.style)
    if (g) return g
  }

  let candidates = GROOVES.filter((g) => g.timeSignature === doc.timeSignature)
  if (candidates.length === 0) {
    candidates = GROOVES.filter((g) => g.beatsPerBar === doc.beatsPerBar)
  }
  if (candidates.length === 0) return null

  // Tempo → feel, within the matching meter. Ballads under ~72, the straight
  // gospel-8 default in the middle, shout-tempo from ~112. For non-4/4 meters
  // there is one groove per signature so this simply returns it.
  const bpm = opts.bpm
  const byStyle = (s: string) => candidates.find((g) => g.style === s)
  if (doc.timeSignature === '4/4' && bpm !== undefined) {
    if (bpm < 72) return byStyle('ballade') ?? candidates[0]
    if (bpm >= 112) return byStyle('shout') ?? byStyle('gospel') ?? candidates[0]
  }
  return byStyle('gospel') ?? candidates[0]
}

/** The fill bar used before a section boundary: hardest library fill that does
 * not exceed the groove's difficulty (4/4 only); synthesised otherwise. */
function fillFor(groove: Groove | null, beatsPerBar: number): DrumHit[] {
  if (beatsPerBar === 4) {
    const maxDiff = groove?.difficulty ?? 1
    const eligible = FILLS.filter((f) => f.difficulty <= maxDiff)
    const pick = eligible.length > 0 ? eligible[eligible.length - 1] : FILLS[0]
    return pick.hits
  }
  return basicFill(beatsPerBar)
}

/**
 * Generate the full drum track for a song: tile the chosen groove from the
 * first full bar to the end, swap in a fill before each internal section
 * boundary, and crash on each section downbeat. Pure — same inputs, same track.
 */
export function generateDrumTrack(doc: SongDoc, style?: string, bpm?: number): DrumHit[] {
  const groove = pickGroove(doc, { style, bpm })
  const pattern = groove ? groove.hits : basicGroove(doc.beatsPerBar)
  const patternLen = groove ? groove.lengthBeats : doc.beatsPerBar
  const { pickupBeats, totalBeats, beatsPerBar } = doc

  if (totalBeats <= pickupBeats || patternLen <= 0) return []

  // 1) Tile the groove across [pickupBeats, totalBeats). Drums rest in the pickup.
  let hits: DrumHit[] = []
  for (let base = pickupBeats; base < totalBeats - EPS; base += patternLen) {
    for (const h of pattern) {
      const t = base + h.t
      if (t < totalBeats - EPS) hits.push({ ...h, t })
    }
  }

  // 2) Internal section boundaries — bars are anchored at pickupBeats.
  const boundaries = doc.sections
    .map((s) => s.startBeat)
    .filter((b) => b > pickupBeats + EPS && b < totalBeats - EPS)

  for (const b of boundaries) {
    // Swap the bar before the boundary for a fill.
    const fillStart = b - beatsPerBar
    if (fillStart >= pickupBeats - EPS) {
      const fill = fillFor(groove, beatsPerBar)
      hits = hits.filter((h) => h.t < fillStart - EPS || h.t >= b - EPS)
      for (const h of fill) {
        const t = fillStart + h.t
        if (t < b - EPS) hits.push({ ...h, t })
      }
    }
    // Crash on the section downbeat — replace any hi-hat/ride on that beat.
    hits = hits.filter(
      (h) =>
        !(Math.abs(h.t - b) < EPS && (h.p === HIHAT || h.p === OPEN_HIHAT || h.p === RIDE)),
    )
    hits.push({ t: b, p: CRASH, v: 0.9 })
  }

  return hits.sort((a, b2) => a.t - b2.t || a.p - b2.p)
}

/** Flatten drum hits into the engine's TrackInput event shape. Drums are
 * one-shots, so the duration is a nominal 0.1 beats (Players ignore it); the
 * hand field is meaningless for drums and fixed to 'R'. */
export function hitsToEngineEvents(hits: DrumHit[]): EngineEvent[] {
  return hits.map((h) => ({ beat: h.t, pitch: h.p, durBeats: 0.1, vel: h.v ?? 0.8, hand: 'R' as const }))
}
