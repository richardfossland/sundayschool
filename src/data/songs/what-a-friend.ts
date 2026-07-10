import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers'

// What a Friend We Have in Jesus (CONVERSE). F major, 4/4, 16 bars.
// Charles Converse (d. 1918) / Joseph Scriven (d. 1886).
// Melody set down by ear — flagged for verification against a hymnal.
const C4 = 60, D4 = 62, F4 = 65, G4 = 67, A4 = 69, Bb4 = 70, C5 = 72

type Steps = [number, number][]
const phraseA = (endNote: number, m3: Steps): Steps => [
  [A4, 1.5], [G4, 0.5], [F4, 1], [D4, 1],
  [C4, 1.5], [D4, 0.5], [F4, 2],
  ...m3,
  [endNote, 4],
]
const m3a: Steps = [[A4, 1.5], [Bb4, 0.5], [A4, 1], [F4, 1]]
const m3b: Steps = [[G4, 1.5], [G4, 0.5], [A4, 1], [G4, 1]]

const melody = song(
  line('R', 0, phraseA(G4, m3a)),
  line('R', 16, phraseA(F4, m3b)),
  line('R', 32, [
    [C5, 1.5], [C5, 0.5], [Bb4, 1], [A4, 1],
    [Bb4, 1.5], [A4, 0.5], [G4, 2],
    [C5, 1.5], [C5, 0.5], [Bb4, 1], [A4, 1],
    [Bb4, 1.5], [A4, 0.5], [G4, 2],
  ]),
  line('R', 48, phraseA(F4, m3b)),
)

const Fst = [41, 48]
const Bbst = [46, 53]
const Cst = [48, 55]
const halves: number[][] = [
  Fst, Fst, Fst, Fst, Bbst, Bbst, Cst, Cst,
  Fst, Fst, Fst, Fst, Cst, Cst, Fst, Fst,
  Fst, Fst, Cst, Cst, Fst, Fst, Cst, Cst,
  Fst, Fst, Fst, Fst, Cst, Cst, Fst, Fst,
]
const left = song(...halves.map((p, i) => stack('L', i * 2, 2, p)))

export const whatAFriend: SeedSong = {
  slug: 'what-a-friend',
  title: 'What a Friend We Have in Jesus',
  subtitle: 'CONVERSE — «Hvilken venn vi har i Jesus»',
  tradition: 'hymne',
  difficulty: 1,
  original_key: 5,
  mode: 'major',
  default_bpm: 88,
  arrangement_style: 'enkel',
  doc: {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats: 64,
    keySignature: 'F',
    sections: [
      { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 16 },
      { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 16, endBeat: 32 },
      { id: 'f3', kind: 'bridge', label: 'Frase 3', startBeat: 32, endBeat: 48 },
      { id: 'f4', kind: 'verse', label: 'Frase 4', startBeat: 48, endBeat: 64 },
    ],
    notes: song(melody, left),
    chords: [
      ch(0, 8, 5), ch(8, 4, 10), ch(12, 4, 0, '7'),
      ch(16, 8, 5), ch(24, 4, 0, '7'), ch(28, 4, 5),
      ch(32, 4, 5), ch(36, 4, 0, '7'), ch(40, 4, 5), ch(44, 4, 0, '7'),
      ch(48, 8, 5), ch(56, 4, 0, '7'), ch(60, 4, 5),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Charles C. Converse', role: 'komponist', deathYear: 1918 },
      { name: 'Joseph M. Scriven', role: 'tekstforfatter', deathYear: 1886 },
    ],
    sources: ['Silver Wings (1870)'],
    verifiedAt: '2026-07-09',
    notes:
      'Eget forenklet arrangement av public domain-verk. Melodi nedtegnet etter gehør — MÅ kontrolleres mot hymnal.',
  },
  tags: ['klassiker', 'kontroller-melodi'],
}
