import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers.ts'

// Kum ba yah. Traditional spiritual (first recorded 1920s, roots older).
// C major, 3/4, 16 bars (4 lines).
const C4 = 60, D4 = 62, E4 = 64, G4 = 67, A4 = 69

const kumLine = [
  [C4, 1], [E4, 1], [G4, 1],
  [G4, 1], [A4, 2],
  [C4, 1], [E4, 1], [G4, 1],
  [G4, 3],
] as [number, number][]

const melody = song(
  line('R', 0, kumLine),
  line('R', 12, kumLine),
  line('R', 24, [
    [C4, 1], [E4, 1], [G4, 1],
    [G4, 1], [A4, 2],
    [G4, 1], [E4, 1], [D4, 1],
    [D4, 3],
  ]),
  line('R', 36, [
    [E4, 2], [D4, 1],
    [C4, 1], [E4, 1], [D4, 1],
    [C4, 3],
    [C4, 3],
  ]),
)
for (const n of melody) if (n.t === 42 && n.p === C4) n.tie = true

const Cst = [48, 55]
const Fst = [41, 48]
const G7 = [43, 53]
const barsLH: number[][] = [
  Cst, Fst, Cst, Cst,
  Cst, Fst, Cst, Cst,
  Cst, Fst, G7, G7,
  Cst, G7, Cst, Cst,
]
const left = song(...barsLH.map((p, i) => stack('L', i * 3, 3, p)))

export const kumbaya: SeedSong = {
  slug: 'kumbaya',
  title: 'Kum ba yah',
  subtitle: null,
  tradition: 'spiritual',
  difficulty: 1,
  original_key: 0,
  mode: 'major',
  default_bpm: 84,
  arrangement_style: 'enkel',
  doc: {
    formatVersion: 1,
    timeSignature: '3/4',
    beatsPerBar: 3,
    pickupBeats: 0,
    totalBeats: 48,
    keySignature: 'C',
    sections: [
      { id: 'l1', kind: 'verse', label: 'Linje 1', startBeat: 0, endBeat: 12 },
      { id: 'l2', kind: 'verse', label: 'Linje 2', startBeat: 12, endBeat: 24 },
      { id: 'l3', kind: 'verse', label: 'Linje 3', startBeat: 24, endBeat: 36 },
      { id: 'l4', kind: 'ending', label: 'Avslutning', startBeat: 36, endBeat: 48 },
    ],
    notes: song(melody, left),
    chords: [
      ch(0, 3, 0), ch(3, 3, 5), ch(6, 6, 0),
      ch(12, 3, 0), ch(15, 3, 5), ch(18, 6, 0),
      ch(24, 3, 0), ch(27, 3, 5), ch(30, 6, 7, '7'),
      ch(36, 3, 0), ch(39, 3, 7, '7'), ch(42, 6, 0),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [{ name: 'Trad. (spiritual)', role: 'komponist', deathYear: null }],
    sources: ['Trad. amerikansk spiritual (nedtegnet 1920-årene)'],
    verifiedAt: '2026-07-09',
    notes:
      'Eget forenklet arrangement. Melodi nedtegnet etter gehør — kontrolleres mot kilde.',
  },
  tags: ['spiritual', 'rolig', 'kontroller-melodi'],
}
