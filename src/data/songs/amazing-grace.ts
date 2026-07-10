import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers.ts'

// Amazing Grace (NEW BRITAIN). 3/4, F major, 1-beat pickup, 16 bars.
// Melody: John Newton's text (d. 1807), tune from Southern Harmony (1835).
const F = 65, G = 67, A = 69, Bb = 70, C = 60, C5 = 72, D = 62

const melody = song(
  line('R', 0, [
    [C, 1], // pickup: "A-"
    [F, 2], [A, 0.5], [F, 0.5],
    [A, 2], [G, 1],
    [F, 2], [D, 1],
    [C, 2], [C, 1],
    [F, 2], [A, 0.5], [F, 0.5],
    [A, 2], [G, 1],
    [C5, 3],
    [C5, 2], [A, 0.5], [C5, 0.5],
    [C5, 2], [A, 0.5], [F, 0.5],
    [A, 2], [G, 1],
    [F, 2], [D, 1],
    [C, 2], [C, 1],
    [F, 2], [A, 0.5], [F, 0.5],
    [A, 2], [G, 1],
    [F, 3],
    [F, 3],
  ]),
)
// Tie the held final note across the barline (m15 → m16).
for (const n of melody) if (n.t === 43 && n.p === F) n.tie = true

// LH: root+fifth as dotted halves, one per bar, following the harmony.
const Fst = [41, 48] // F2 + C3
const Bbst = [46, 53] // Bb2 + F3
const Cchord = [48, 55] // C3 + G3

const bars: number[][] = [
  Fst, Fst, Bbst, Fst,
  Fst, Fst, Cchord, Cchord,
  Fst, Fst, Bbst, Fst,
  Bbst, Cchord, Fst, Fst,
]
const left = song(...bars.map((p, i) => stack('L', 1 + i * 3, 3, p)))

export const amazingGrace: SeedSong = {
  slug: 'amazing-grace',
  title: 'Amazing Grace',
  subtitle: 'NEW BRITAIN',
  tradition: 'hymne',
  difficulty: 1,
  original_key: 5, // F
  mode: 'major',
  default_bpm: 84,
  arrangement_style: 'enkel',
  doc: {
    formatVersion: 1,
    timeSignature: '3/4',
    beatsPerBar: 3,
    pickupBeats: 1,
    totalBeats: 49,
    keySignature: 'F',
    sections: [
      { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 13 },
      { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 13, endBeat: 25 },
      { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 25, endBeat: 37 },
      { id: 'f4', kind: 'verse', label: 'Frase 4', startBeat: 37, endBeat: 49 },
    ],
    notes: song(melody, left),
    chords: [
      ch(0, 7, 5), ch(7, 3, 10), ch(10, 9, 5),
      ch(19, 3, 0), ch(22, 3, 0, '7'), ch(25, 3, 5), ch(28, 3, 5, '7'),
      ch(31, 3, 10), ch(34, 3, 5), ch(37, 3, 10), ch(40, 3, 0, '7'),
      ch(43, 6, 5),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [
      { name: 'John Newton', role: 'tekstforfatter', deathYear: 1807 },
      { name: 'Trad. (NEW BRITAIN, Southern Harmony 1835)', role: 'komponist', deathYear: null },
    ],
    sources: ['Olney Hymns (1779)', 'Southern Harmony (1835)'],
    verifiedAt: '2026-07-09',
    notes: 'Eget forenklet arrangement av public domain-verk.',
  },
  tags: ['klassiker', 'engelsk'],
}
