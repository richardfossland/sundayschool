import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers.ts'

// Swing Low, Sweet Chariot. 4/4, F major, 16 bars (refreng ×2, vers, refreng).
// Traditional spiritual (Wallis Willis, ca. 1860s; published 1872, Fisk Jubilee
// Singers). Melody set down by ear — pentatonic F-major form.
const C4 = 60, D4 = 62, F4 = 65, G4 = 67, A4 = 69, C5 = 72, D5 = 74

// One 4-bar chorus phrase: «Swing low, sweet chariot, comin' for to carry me home».
const chorus = (lastNote: number): Parameters<typeof line>[2] => [
  [A4, 2], [F4, 2],
  [G4, 1], [A4, 0.5], [G4, 0.5], [F4, 2],
  [C4, 1], [D4, 1], [F4, 1], [F4, 1],
  [D4, 2], [lastNote, 2],
]

const melody = song(
  line('R', 0, chorus(C4)),
  line('R', 16, chorus(C4)),
  // Vers: «I looked over Jordan, and what did I see …»
  line('R', 32, [
    [F4, 1], [A4, 1], [C5, 1], [C5, 1],
    [D5, 1], [C5, 1], [A4, 1], [F4, 1],
    [C4, 1], [D4, 1], [F4, 1], [F4, 1],
    [D4, 2], [C4, 2],
  ]),
  line('R', 48, chorus(F4)),
)

// LH: two half-note stacks per bar.
const Fst = [41, 48] // F2 + C3
const Bbst = [46, 53] // Bb2 + F3
const C7 = [48, 55] // C3 + G3
const barsLH: number[][] = [
  Fst, Bbst, Fst, C7,
  Fst, Bbst, Fst, C7,
  Fst, Fst, Bbst, C7,
  Fst, Bbst, C7, Fst,
]
const left = song(
  ...barsLH.flatMap((p, i) => [stack('L', i * 4, 2, p), stack('L', i * 4 + 2, 2, p)]),
)

export const swingLow: SeedSong = {
  slug: 'swing-low',
  title: 'Swing Low, Sweet Chariot',
  subtitle: null,
  tradition: 'spiritual',
  difficulty: 1,
  original_key: 5, // F
  mode: 'major',
  default_bpm: 76,
  arrangement_style: 'enkel',
  doc: {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats: 64,
    keySignature: 'F',
    sections: [
      { id: 'ref1', kind: 'refrain', label: 'Refreng', startBeat: 0, endBeat: 16 },
      { id: 'ref2', kind: 'refrain', label: 'Refreng (gjentak)', startBeat: 16, endBeat: 32 },
      { id: 'v1', kind: 'verse', label: 'Vers', startBeat: 32, endBeat: 48 },
      { id: 'ref3', kind: 'refrain', label: 'Refreng (siste)', startBeat: 48, endBeat: 64 },
    ],
    notes: song(melody, left),
    chords: [
      ch(0, 4, 5), ch(4, 4, 10), ch(8, 4, 5), ch(12, 4, 0, '7'),
      ch(16, 4, 5), ch(20, 4, 10), ch(24, 4, 5), ch(28, 4, 0, '7'),
      ch(32, 8, 5), ch(40, 4, 10), ch(44, 4, 0, '7'),
      ch(48, 4, 5), ch(52, 4, 10), ch(56, 4, 0, '7'), ch(60, 4, 5),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Wallis Willis (trad. spiritual)', role: 'komponist', deathYear: null },
    ],
    sources: ['Jubilee Songs (Fisk Jubilee Singers, 1872)'],
    verifiedAt: '2026-07-09',
    notes:
      'Eget forenklet arrangement av public domain-verk. Melodi nedtegnet etter gehør — kontrolleres mot kilde før ev. promotering.',
  },
  tags: ['spiritual', 'rolig'],
}
