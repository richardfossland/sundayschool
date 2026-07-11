// ── Instrument register ──────────────────────────────────────────────────────
// The single source of truth for every playable instrument in SundaySchool.
// engine.ts reads these specs to lazily build one Tone node per instrument.
//
// Two node kinds:
//  • 'sampler'  — pitched instruments (piano/guitar/bass). A Tone.Sampler
//                 pitch-shifts between the sampled notes, so a sparse subset
//                 (roughly every minor third) covers the whole range. `urls`
//                 maps a NOTE NAME (e.g. 'A2', 'D#3') → filename.
//  • 'players'  — drums. A Tone.Players holds one one-shot per drum piece,
//                 keyed by its GM percussion PITCH NUMBER (36 = kick …). Drums
//                 are NEVER pitch-shifted or transposed — the pitch is only an
//                 identity, so `urls` maps a NUMBER → filename and the engine
//                 triggers `player(String(pitch)).start(time)`.
//
// All samples are SELF-HOSTED under public/samples/<instrument>/ (no external
// runtime CDN). `scripts/fetch-samples.mjs` downloads + renames them; see
// public/samples/CREDITS.md for the exact source + licence of every file.

export type InstrumentId = 'piano' | 'guitar' | 'bass' | 'drums'

export interface SamplerSpec {
  kind: 'sampler'
  baseUrl: string
  /** Note name (e.g. 'A2', 'D#3') → sample filename. */
  urls: Record<string, string>
  release: number
}

export interface PlayersSpec {
  kind: 'players'
  baseUrl: string
  /** GM percussion pitch number → sample filename. */
  urls: Record<number, string>
}

export type InstrumentSpec = SamplerSpec | PlayersSpec

/**
 * Piano = the historical Salamander Grand subset (every minor third A0–C8),
 * now self-hosted. Kept byte-for-byte identical to the old `buildSampleMap()`
 * in engine.ts so piano playback is unchanged — only the baseUrl moved from the
 * Tone.js CDN to /samples/piano/.
 */
function buildPianoSampleMap(): Record<string, string> {
  const roots = ['A', 'C', 'D#', 'F#']
  const map: Record<string, string> = {}
  for (let octave = 0; octave <= 7; octave++) {
    for (const r of roots) {
      // A0 is the lowest sample; C8 the highest.
      if (octave === 0 && (r === 'C' || r === 'D#' || r === 'F#')) continue
      const note = `${r}${octave}`
      const file = `${r.replace('#', 's')}${octave}.mp3`
      map[note] = file
    }
  }
  map['C8'] = 'C8.mp3'
  return map
}

export const INSTRUMENTS: Record<InstrumentId, InstrumentSpec> = {
  piano: {
    kind: 'sampler',
    baseUrl: '/samples/piano/',
    urls: buildPianoSampleMap(),
    release: 1,
  },
  // Acoustic guitar — a minor-third subset A2–C5 of the tonejs-instruments
  // guitar-acoustic set. The Sampler extrapolates up to ~E5 and down below the
  // low E string, covering the practical strumming/melody range.
  guitar: {
    kind: 'sampler',
    baseUrl: '/samples/guitar/',
    urls: {
      A2: 'A2.mp3',
      C3: 'C3.mp3',
      'D#3': 'Ds3.mp3',
      'F#3': 'Fs3.mp3',
      A3: 'A3.mp3',
      C4: 'C4.mp3',
      'D#4': 'Ds4.mp3',
      'F#4': 'Fs4.mp3',
      A4: 'A4.mp3',
      C5: 'C5.mp3',
    },
    release: 1,
  },
  // Electric bass — an E1–G3 subset of the tonejs-instruments bass-electric set
  // (its native sample grid is E/G/A#/C#), clamped to the electric bass range.
  bass: {
    kind: 'sampler',
    baseUrl: '/samples/bass/',
    urls: {
      E1: 'E1.mp3',
      G1: 'G1.mp3',
      'A#1': 'As1.mp3',
      'C#2': 'Cs2.mp3',
      E2: 'E2.mp3',
      G2: 'G2.mp3',
      'A#2': 'As2.mp3',
      'C#3': 'Cs3.mp3',
      E3: 'E3.mp3',
      G3: 'G3.mp3',
    },
    release: 0.6,
  },
  // Drum kit — CC0 one-shots keyed by GM percussion pitch. NEVER pitch-shifted.
  //  36 kick · 38 snare · 42 closed hi-hat · 46 open hi-hat ·
  //  41/45/48 low/mid/high tom · 49 crash · 51 ride.
  drums: {
    kind: 'players',
    baseUrl: '/samples/drums/',
    urls: {
      36: '36.flac', // acoustic bass drum / kick
      38: '38.flac', // acoustic snare
      42: '42.flac', // closed hi-hat
      46: '46.flac', // open hi-hat
      41: '41.flac', // low floor tom
      45: '45.flac', // mid tom
      48: '48.flac', // high tom
      49: '49.flac', // crash cymbal
      51: '51.flac', // ride cymbal
    },
  },
}
