import type { SeedSong } from '@/types/song'
import { line, stack, ch, song } from './_helpers.ts'
import { amazingGrace } from './amazing-grace.ts'

// Amazing Grace — firstemmig-inspirert utgave (difficulty 2). Same melody as
// the enkel arrangement; RH adds an alto line in (mostly) thirds/sixths and
// LH walks root–fifth instead of blocked chords.
const F3 = 53, G3 = 55, A3 = 57, Bb3 = 58, C4 = 60, D4 = 62, E4 = 64, F4 = 65

// Alto: follows the harmony under the melody, one note per melody rhythm-group.
const alto = song(
  line('R', 0, [
    [A3, 1], // under pickup C4 (F-chord: A)
    [C4, 2], [C4, 1],
    [C4, 2], [C4, 1],
    [C4, 2], [Bb3, 1],
    [A3, 2], [A3, 1],
    [C4, 2], [C4, 1],
    [C4, 2], [C4, 1],
    [E4, 3],
    [E4, 2], [F4, 1],
    [F4, 2], [C4, 1],
    [C4, 2], [C4, 1],
    [C4, 2], [Bb3, 1],
    [A3, 2], [A3, 1],
    [Bb3, 2], [Bb3, 1],
    [C4, 2], [Bb3, 1],
    [A3, 3],
    [A3, 3],
  ]),
)

// LH: root (2 beats) + fifth (1 beat) walking pattern per bar.
const walk = (t: number, root: number, fifth: number) =>
  song(stack('L', t, 2, [root]), stack('L', t + 2, 1, [fifth]))
const F2 = 41, C3 = 48, Bb2 = 46, G2 = 43
const bars: [number, number][] = [
  [F2, C3], [F2, C3], [Bb2, F3], [F2, C3],
  [F2, C3], [F2, C3], [C3, G3], [C3, G3],
  [F2, C3], [F2, C3], [Bb2, F3], [F2, C3],
  [Bb2, F3], [C3, G3], [F2, C3], [F2, C3],
]
const left = song(...bars.map(([r, f], i) => walk(1 + i * 3, r, f)))

// Reuse the verified melody + chords from the enkel arrangement.
const melody = amazingGrace.doc.notes.filter((n) => n.h === 'R')

export const amazingGraceFirstemmig: SeedSong = {
  slug: 'amazing-grace-firstemmig',
  title: 'Amazing Grace (firstemmig)',
  subtitle: 'NEW BRITAIN — utvidet sats',
  tradition: 'hymne',
  difficulty: 2,
  original_key: 5,
  mode: 'major',
  default_bpm: 76,
  arrangement_style: 'firstemmig',
  doc: {
    ...amazingGrace.doc,
    notes: song(melody, alto, left),
  },
  rights: {
    ...amazingGrace.rights,
    notes: 'Eget utvidet arrangement (alt-stemme + gående bass) av public domain-verk.',
  },
  tags: ['klassiker', 'engelsk', 'utvidet'],
}
