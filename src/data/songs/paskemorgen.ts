import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers'

// Påskemorgen slukker sorgen (Lindeman 1864 / Grundtvig).
// D major, 4/4, 8 bars. Melody reconstructed by ear — flagged for verification
// against Lindemans koralbok before promotion.
const D4 = 62, E4 = 64, Fs4 = 66, G4 = 67, A4 = 69, B4 = 71, Cs5 = 73, D5 = 74

const melody = song(
  line('R', 0, [
    [D4, 1], [Fs4, 1], [A4, 1], [A4, 1],
    [B4, 1], [B4, 1], [A4, 2],
    [G4, 1], [Fs4, 1], [E4, 1], [E4, 1],
    [Fs4, 1], [E4, 1], [D4, 2],
    [A4, 1], [A4, 1], [B4, 1], [Cs5, 1],
    [D5, 1], [Cs5, 1], [B4, 1], [A4, 1],
    [G4, 1], [Fs4, 1], [E4, 1], [E4, 1],
    [D4, 4],
  ]),
)

const Dst = [38, 45] // D2 + A2
const Gst = [43, 50] // G2 + D3
const A7 = [45, 52] // A2 + E3
const halves: number[][] = [
  Dst, Dst, Gst, A7,
  Gst, A7, Dst, Dst,
  Dst, Dst, Dst, A7,
  Gst, A7, A7, Dst,
]
const left = song(...halves.map((p, i) => stack('L', i * 2, 2, p)))

export const paskemorgen: SeedSong = {
  slug: 'paskemorgen',
  title: 'Påskemorgen slukker sorgen',
  subtitle: 'Lindeman / Grundtvig',
  tradition: 'salme',
  difficulty: 1,
  original_key: 2, // D
  mode: 'major',
  default_bpm: 92,
  arrangement_style: 'enkel',
  doc: {
    formatVersion: 1,
    timeSignature: '4/4',
    beatsPerBar: 4,
    pickupBeats: 0,
    totalBeats: 32,
    keySignature: 'D',
    sections: [
      { id: 'f1', kind: 'verse', label: 'Frase 1', startBeat: 0, endBeat: 16 },
      { id: 'f2', kind: 'verse', label: 'Frase 2', startBeat: 16, endBeat: 32 },
    ],
    notes: song(melody, left),
    chords: [
      ch(0, 4, 2), ch(4, 2, 7), ch(6, 2, 9, '7'),
      ch(8, 2, 7), ch(10, 2, 9, '7'), ch(12, 4, 2),
      ch(16, 4, 2), ch(20, 2, 2), ch(22, 2, 9, '7'),
      ch(24, 2, 7), ch(26, 2, 9, '7'), ch(28, 4, 2),
    ],
  },
  rights: {
    publicDomain: true,
    creators: [
      { name: 'Ludvig M. Lindeman', role: 'komponist', deathYear: 1887 },
      { name: 'N. F. S. Grundtvig', role: 'tekstforfatter', deathYear: 1872 },
    ],
    sources: ['Lindemans koralbok (1877)'],
    verifiedAt: '2026-07-09',
    notes:
      'Eget forenklet arrangement av public domain-verk. Melodi rekonstruert etter gehør — MÅ kontrolleres mot Lindemans koralbok.',
  },
  tags: ['norsk', 'påske', 'kontroller-melodi'],
}
