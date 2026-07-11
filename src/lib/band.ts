// ── Band-modus — the ensemble mixer (pure track assembly) ────────────────────
//
// Band-modus lets a learner play their own instrument WHILE the app plays the
// rest of the band. This module is the pure, deterministic core: it turns a
// (already transposed) SongDoc into the set of accompaniment tracks the engine
// should schedule as `extraTracks`, EXCLUDING the instrument the learner plays
// themselves (`opts.exclude`). Everything downstream — per-track volume/mute —
// is live on the engine's mixer, so the track list here never has to change for
// a level tweak.
//
// The default band is the rhythm section every fag shares: PIANO + BASS + DRUMS.
//  • Piano  — the song's own notes (buildEvents, hand:'both'); the harmonic core.
//  • Bass   — generateBassline at level 2 (root/fifth) by default: a solid,
//             unobtrusive foundation that suits play-along without stealing focus.
//  • Drums  — generateDrumTrack (groove tiled, fills, crashes) — the timekeeper.
//
// GUITAR is intentionally NOT in the default mix. A strummed guitar layered on
// top of the piano tends to muddy the harmony (two chording instruments fighting
// for the same mid-range), so it is opt-in only: pass `strumPatternId` to add it.
// The one place it naturally belongs — the gitar fag itself — excludes guitar
// anyway (the learner strums), so the gitar fag's band is piano+bass+drums with
// no guitar track, which is exactly right.

import type { SongDoc } from '@/types/song'
import type { InstrumentId } from './instruments'
import type { SongEngine, TrackInput } from './engine'
import { buildEvents } from './engine-events'
import { generateBassline, type BassLevel } from './bass/bassline'
import { generateDrumTrack, hitsToEngineEvents } from './drums/drum-track'
import { strumEvents, patternById, defaultPatternFor } from './guitar/strumming'

/** Every instrument the band mixer can address. */
export const BAND_INSTRUMENTS: InstrumentId[] = ['piano', 'bass', 'drums', 'guitar']

/** Balanced starting level (linear gain 0–1) per instrument. Drums and guitar
 * sit a touch under the harmonic core so the learner's own part stays on top. */
export const DEFAULT_BAND_GAIN: Record<InstrumentId, number> = {
  piano: 0.9,
  bass: 0.85,
  drums: 0.65,
  guitar: 0.75,
}

/** Linear gain (0–1) → decibels for the engine mixer. Floored at −60 dB so a
 * slider at zero is effectively silent without producing −Infinity. */
export function gainToDb(gain: number): number {
  if (gain <= 0.0001) return -60
  return 20 * Math.log10(gain)
}

export interface BandOptions {
  /** The learner's own instrument — omitted from the generated band (they play
   * it themselves). Undefined = the full default band. */
  exclude?: InstrumentId
  /** Song tempo — only used to pick a drum groove that suits the feel; the track
   * is scheduled in tempo-independent beats, so this never needs to be "live". */
  bpm: number
  /** Bassline complexity (see generateBassline). Default 2 = root & fifth. */
  bassLevel?: BassLevel
  /** Explicit drum groove override (matches Groove.style or id). */
  drumStyle?: string
  /** Opt-in guitar: a strum-pattern id (or '' → the meter's default pattern)
   * adds a strummed acoustic-guitar track. Absent = no guitar (the default). */
  strumPatternId?: string
}

/**
 * Assemble the band's accompaniment tracks for a song. `doc` is the already
 * transposed score (piano notes + chord track drive the generators, so what the
 * band plays matches the learner's target key). Pure + deterministic: the same
 * doc + opts always yield the same tracks in the same order.
 */
export function bandTracks(doc: SongDoc, opts: BandOptions): TrackInput[] {
  const tracks: TrackInput[] = []
  const wants = (id: InstrumentId) => opts.exclude !== id

  // Piano — the song's own notes, both hands, no extra transposition (doc is
  // already in the target key).
  if (wants('piano')) {
    tracks.push({
      instrument: 'piano',
      events: buildEvents(doc, { hand: 'both', transpose: 0 }),
      volumeDb: gainToDb(DEFAULT_BAND_GAIN.piano),
    })
  }

  // Bass — generated from the chord track (default level 2: root & fifth).
  if (wants('bass')) {
    tracks.push({
      instrument: 'bass',
      events: generateBassline(doc.chords, doc, opts.bassLevel ?? 2),
      volumeDb: gainToDb(DEFAULT_BAND_GAIN.bass),
    })
  }

  // Drums — groove tiled across the song (rests in the pickup, fills + crashes
  // at section boundaries). The bpm only steers the groove choice.
  if (wants('drums')) {
    tracks.push({
      instrument: 'drums',
      events: hitsToEngineEvents(generateDrumTrack(doc, opts.drumStyle, opts.bpm)),
      volumeDb: gainToDb(DEFAULT_BAND_GAIN.drums),
    })
  }

  // Guitar — OPT-IN only (see file header). Layered strum on the chord track.
  if (wants('guitar') && opts.strumPatternId !== undefined) {
    const pattern = patternById(opts.strumPatternId) ?? defaultPatternFor(doc.timeSignature)
    tracks.push({
      instrument: 'guitar',
      events: strumEvents(doc.chords, pattern, doc.beatsPerBar, doc.totalBeats, {
        pickupBeats: doc.pickupBeats,
      }),
      volumeDb: gainToDb(DEFAULT_BAND_GAIN.guitar),
    })
  }

  return tracks
}

/**
 * Re-apply the learner's saved mixer levels (linear gains from the store's
 * bandMix) to the engine after a (re)build — build() resets each track to its
 * default volumeDb, so this restores any sliders the learner has moved. Mutes
 * are NOT reset by build (they live on the persistent Volume node), so they need
 * no re-apply here. No-op for instruments the learner has never touched.
 */
export function applyBandMix(engine: SongEngine, mix: Partial<Record<InstrumentId, number>>): void {
  for (const inst of BAND_INSTRUMENTS) {
    const gain = mix[inst]
    if (gain === undefined) continue
    engine.setTrackVolume(inst, gainToDb(gain))
  }
}
