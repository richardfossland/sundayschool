import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers.ts'

// When the Saints Go Marching In. 4/4, C major, 3-beat pickup, 14 bars.
// Traditional American spiritual (published early 1900s, roots older).
const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, R = 0

const melody = song(
  line('R', 0, [
    [C4, 1], [E4, 1], [F4, 1], // pickup: "Oh when the"
    [G4, 4], // "saints"
    [R, 1], [C4, 1], [E4, 1], [F4, 1],
    [G4, 4],
    [R, 1], [C4, 1], [E4, 1], [F4, 1],
    [G4, 2], [E4, 2], // "saints go"
    [C4, 2], [E4, 2], // "march-ing"
    [D4, 4], // "in"
    [R, 1], [E4, 1], [E4, 1], [D4, 1], // "oh how I"
    [C4, 2], [C4, 1], [E4, 1], // "want to be"
    [G4, 2], [G4, 1], [F4, 1], // "in that num-ber"
    [E4, 2], [C4, 1], [E4, 1], // "when the saints"
    [D4, 4], // "go march-ing"
    [C4, 4], // "in"
    [C4, 4],
  ]),
)
for (const n of melody) if (n.t === 51 && n.p === C4) n.tie = true

// LH: two half-note stacks per bar.
const Cst = [48, 55] // C3 + G3
const Fst = [41, 48] // F2 + C3
const G7 = [43, 53] // G2 + F3
const barsLH: number[][] = [
  Cst, Cst, Cst, Cst, Cst, Cst, G7, G7, Cst, Cst, Fst, Cst, G7, Cst,
]
const left = song(
  ...barsLH.flatMap((p, i) => [stack('L', 3 + i * 4, 2, p), stack('L', 5 + i * 4, 2, p)]),
)

export const whenTheSaints: SeedSong = {
  slug: 'when-the-saints',
  work_slug: 'when-the-saints',
  variant_label: null,
  title: 'When the Saints Go Marching In',
  subtitle: 'Oh When the Saints',
  tradition: 'spiritual',
  difficulty: 1,
  original_key: 0, // C
  mode: 'major',
  default_bpm: 108,
  arrangement_style: 'enkel',
  doc: {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 3,
    totalBeats: 59,
    sections: [
      { id: 'a', kind: 'verse', label: 'Del A', startBeat: 0, endBeat: 19 },
      { id: 'b', kind: 'verse', label: 'Del B', startBeat: 19, endBeat: 35 },
      { id: 'c', kind: 'verse', label: 'Del C', startBeat: 35, endBeat: 59 },
    ],
    keySignature: 'C',
    notes: song(melody, left),
    chords: [
      ch(0, 23, 0), ch(23, 4, 0), ch(27, 8, 7, '7'), // C … G7 under «in»
      ch(35, 4, 0), ch(39, 4, 0, '7'), ch(43, 4, 5), ch(47, 4, 0),
      ch(51, 4, 7, '7'), ch(55, 4, 0),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [{ name: 'Trad. (spiritual)', role: 'komponist', deathYear: null }],
    sources: ['Trad. amerikansk spiritual (publisert tidlig 1900-tall)'],
    verifiedAt: '2026-07-09',
    notes: 'Eget forenklet arrangement av tradisjonelt public domain-verk.',
  },
  tags: ['spiritual', 'glad'],
}
