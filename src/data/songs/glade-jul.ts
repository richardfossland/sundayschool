import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers.ts'

// Glade jul (Stille Nacht / Silent Night). Notated in 3/4 (common hymnal form
// of the 6/8 original — dotted figures keep the lilt). C major, 24 bars.
// Gruber (d. 1863) / Mohr (d. 1848); Norwegian text W. A. Wexels (d. 1866).
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71
const C5 = 72, D5 = 74, E5 = 76, F5 = 77

const melody = song(
  line('R', 0, [
    [G4, 1.5], [A4, 0.5], [G4, 1],
    [E4, 3],
    [G4, 1.5], [A4, 0.5], [G4, 1],
    [E4, 3],
    [D5, 2], [D5, 1],
    [B4, 3],
    [C5, 2], [C5, 1],
    [G4, 3],
    [A4, 2], [A4, 1],
    [C5, 1.5], [B4, 0.5], [A4, 1],
    [G4, 1.5], [A4, 0.5], [G4, 1],
    [E4, 3],
    [A4, 2], [A4, 1],
    [C5, 1.5], [B4, 0.5], [A4, 1],
    [G4, 1.5], [A4, 0.5], [G4, 1],
    [E4, 3],
    [D5, 2], [D5, 1],
    [F5, 1.5], [D5, 0.5], [B4, 1],
    [C5, 3],
    [E5, 3],
    [C5, 1], [G4, 1], [E4, 1],
    [G4, 1.5], [F4, 0.5], [D4, 1],
    [C4, 3],
    [C4, 3],
  ]),
)
for (const n of melody) if (n.t === 66 && n.p === C4) n.tie = true

// LH: one dotted-half stack per bar.
const Cst = [48, 55] // C3 + G3
const Fst = [41, 48] // F2 + C3
const G7 = [43, 53] // G2 + F3
const barsLH: number[][] = [
  Cst, Cst, Cst, Cst,
  G7, G7, Cst, Cst,
  Fst, Fst, Cst, Cst,
  Fst, Fst, Cst, Cst,
  G7, G7, Cst, Cst,
  Cst, G7, Cst, Cst,
]
const left = song(...barsLH.map((p, i) => stack('L', i * 3, 3, p)))

export const gladeJul: SeedSong = {
  slug: 'glade-jul',
  work_slug: 'glade-jul',
  variant_label: null,
  title: 'Glade jul',
  subtitle: 'Stille Nacht / Silent Night',
  tradition: 'salme',
  difficulty: 1,
  original_key: 0, // C
  mode: 'major',
  default_bpm: 78,
  arrangement_style: 'enkel',
  doc: {
    formatVersion: 1,
    timeSignature: '3/4',
    beatsPerBar: 3,
    pickupBeats: 0,
    totalBeats: 72,
    keySignature: 'C',
    sections: [
      { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 12 },
      { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 12, endBeat: 24 },
      { id: 'f3', kind: 'verse', label: 'Frase 3', startBeat: 24, endBeat: 48 },
      { id: 'f4', kind: 'verse', label: 'Frase 4', startBeat: 48, endBeat: 72 },
    ],
    notes: song(melody, left),
    chords: [
      ch(0, 12, 0), ch(12, 6, 7, '7'), ch(18, 6, 0),
      ch(24, 6, 5), ch(30, 6, 0), ch(36, 6, 5), ch(42, 6, 0),
      ch(48, 6, 7, '7'), ch(54, 6, 0), ch(60, 3, 0), ch(63, 3, 7, '7'),
      ch(66, 6, 0),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Franz Gruber', role: 'komponist', deathYear: 1863 },
      { name: 'Joseph Mohr', role: 'tekstforfatter', deathYear: 1848 },
      { name: 'W. A. Wexels', role: 'oversetter', deathYear: 1866 },
    ],
    sources: ['Stille Nacht (1818); norsk tekst 1850-årene'],
    verifiedAt: '2026-07-09',
    notes: 'Eget forenklet arrangement av public domain-verk.',
  },
  tags: ['jul', 'rolig'],
}
