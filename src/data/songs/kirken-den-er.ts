import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers'

// Kirken den er et gammelt hus (Lindeman 1840 / Grundtvig).
// F major, 4/4, 8 bars. Melody reconstructed by ear — flagged for verification
// against Lindemans koralbok before promotion.
const F4 = 65, G4 = 67, A4 = 69, Bb4 = 70, C5 = 72, D5 = 74

const melody = song(
  line('R', 0, [
    [F4, 1], [F4, 1], [G4, 1], [A4, 1],
    [Bb4, 1], [A4, 1], [G4, 2],
    [A4, 1], [A4, 1], [Bb4, 1], [C5, 1],
    [A4, 1], [G4, 1], [F4, 2],
    [C5, 1], [C5, 1], [D5, 1], [C5, 1],
    [Bb4, 1], [A4, 1], [G4, 2],
    [A4, 1], [Bb4, 1], [A4, 1], [G4, 1],
    [F4, 4],
  ]),
)

const Fst = [41, 48]
const Bbst = [46, 53]
const Cst = [48, 55]
const halves: number[][] = [
  Fst, Fst, Bbst, Cst,
  Fst, Fst, Cst, Fst,
  Fst, Fst, Bbst, Cst,
  Fst, Cst, Fst, Fst,
]
const left = song(...halves.map((p, i) => stack('L', i * 2, 2, p)))

export const kirkenDenEr: SeedSong = {
  slug: 'kirken-den-er-et-gammelt-hus',
  title: 'Kirken den er et gammelt hus',
  subtitle: 'Lindeman / Grundtvig',
  tradition: 'salme',
  difficulty: 1,
  original_key: 5,
  mode: 'major',
  default_bpm: 84,
  arrangement_style: 'enkel',
  doc: {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats: 32,
    keySignature: 'F',
    sections: [
      { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 16 },
      { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 16, endBeat: 32 },
    ],
    notes: song(melody, left),
    chords: [
      ch(0, 4, 5), ch(4, 2, 10), ch(6, 2, 0, '7'),
      ch(8, 4, 5), ch(12, 2, 0, '7'), ch(14, 2, 5),
      ch(16, 4, 5), ch(20, 2, 10), ch(22, 2, 0, '7'),
      ch(24, 2, 5), ch(26, 2, 0, '7'), ch(28, 4, 5),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Ludvig M. Lindeman', role: 'komponist', deathYear: 1887 },
      { name: 'N. F. S. Grundtvig', role: 'tekstforfatter', deathYear: 1872 },
      { name: 'M. B. Landstad (norsk form)', role: 'oversetter', deathYear: 1880 },
    ],
    sources: ['Lindemans koralbok (1877); Landstads salmebok'],
    verifiedAt: '2026-07-09',
    notes:
      'Eget forenklet arrangement av public domain-verk. Melodi rekonstruert etter gehør — MÅ kontrolleres mot Lindemans koralbok.',
  },
  tags: ['norsk', 'klassiker', 'kontroller-melodi'],
}
