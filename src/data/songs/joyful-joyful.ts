import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers'

// Joyful, Joyful, We Adore Thee (HYMN TO JOY — Beethoven, 9. symfoni 1824).
// G major, 4/4, 16 bars. Difficulty 2: melody + alto in thirds (RH),
// bass + fifth (LH). Text: Henry van Dyke (d. 1933).
const D4 = 62, E4 = 64, Fs4 = 66, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74

type Steps = [number, number][]
const phrase1: Steps = [
  [B4, 1], [B4, 1], [C5, 1], [D5, 1],
  [D5, 1], [C5, 1], [B4, 1], [A4, 1],
  [G4, 1], [G4, 1], [A4, 1], [B4, 1],
  [B4, 1.5], [A4, 0.5], [A4, 2],
]
const phrase2: Steps = [
  [B4, 1], [B4, 1], [C5, 1], [D5, 1],
  [D5, 1], [C5, 1], [B4, 1], [A4, 1],
  [G4, 1], [G4, 1], [A4, 1], [B4, 1],
  [A4, 1.5], [G4, 0.5], [G4, 2],
]
const phrase3: Steps = [
  [A4, 1], [A4, 1], [B4, 1], [G4, 1],
  [A4, 1], [B4, 0.5], [C5, 0.5], [B4, 1], [G4, 1],
  [A4, 1], [B4, 0.5], [C5, 0.5], [B4, 1], [A4, 1],
  [G4, 1], [A4, 1], [D4, 2],
]
const THIRDS: Record<number, number> = {
  [B4]: G4, [C5]: A4, [D5]: B4, [A4]: Fs4, [G4]: E4, [D4]: 0,
}
const altoOf = (steps: Steps): Steps =>
  steps.map(([p, d]) => [p === 0 ? 0 : (THIRDS[p] ?? 0), d])

// Alto cadence fix: under the final G–G the third would be an E (wrong chord);
// land on D (chord fifth) instead.
const altoCadence = (steps: Steps): Steps => {
  const a = altoOf(steps)
  a[a.length - 1] = [D4, 2]
  a[a.length - 2] = [E4, 0.5]
  return a.filter(([p]) => p !== 0)
}

const melody = song(
  line('R', 0, phrase1),
  line('R', 16, phrase2),
  line('R', 32, phrase3),
  line('R', 48, phrase2),
)
const alto = song(
  line('R', 0, altoOf(phrase1).filter(([p]) => p !== 0)),
  line('R', 16, altoCadence(phrase2)),
  line('R', 48, altoCadence(phrase2)),
)

// LH: two half-note stacks per bar following the harmony.
const Gst = [43, 50] // G2 + D3
const Dst = [38, 45] // D2 + A2
const D7 = [38, 48] // D2 + C3
const halves: number[][] = [
  Gst, Gst, Dst, Dst, Gst, Gst, Dst, Dst,
  Gst, Gst, Dst, Dst, Gst, Gst, D7, Gst,
  Dst, Dst, Gst, Gst, Dst, Dst, Dst, Dst,
  Gst, Gst, Dst, Dst, Gst, Gst, D7, Gst,
]
const left = song(...halves.map((p, i) => stack('L', i * 2, 2, p)))

export const joyfulJoyful: SeedSong = {
  slug: 'joyful-joyful',
  title: 'Joyful, Joyful, We Adore Thee',
  subtitle: 'Hymn to Joy — Beethoven',
  tradition: 'hymne',
  difficulty: 2,
  original_key: 7, // G
  mode: 'major',
  default_bpm: 100,
  arrangement_style: 'firstemmig',
  doc: {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats: 64,
    keySignature: 'G',
    sections: [
      { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 16 },
      { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 16, endBeat: 32 },
      { id: 'f3', kind: 'bridge', label: 'Frase 3', startBeat: 32, endBeat: 48 },
      { id: 'f4', kind: 'verse', label: 'Frase 4', startBeat: 48, endBeat: 64 },
    ],
    notes: song(melody, alto, left),
    chords: [
      ch(0, 4, 7), ch(4, 4, 2), ch(8, 4, 7), ch(12, 4, 2),
      ch(16, 4, 7), ch(20, 4, 2), ch(24, 4, 7), ch(28, 2, 2, '7'), ch(30, 2, 7),
      ch(32, 4, 2), ch(36, 4, 7), ch(40, 4, 2), ch(44, 4, 2),
      ch(48, 4, 7), ch(52, 4, 2), ch(56, 4, 7), ch(60, 2, 2, '7'), ch(62, 2, 7),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Ludwig van Beethoven', role: 'komponist', deathYear: 1827 },
      { name: 'Henry van Dyke', role: 'tekstforfatter', deathYear: 1933 },
    ],
    sources: ['Symfoni nr. 9 (1824); hymneform i amerikanske hymnaler fra 1911'],
    verifiedAt: '2026-07-09',
    notes: 'Eget firstemmig-inspirert arrangement av public domain-verk.',
  },
  tags: ['klassiker', 'glad'],
}
