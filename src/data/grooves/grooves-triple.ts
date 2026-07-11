import type { Groove } from '@/lib/drums/types'
import { K, S, HH, RD, at, pulse, groove } from './_helpers.ts'

// ── Triple-meter grooves (3/4, 6/8, 12/8) ─────────────────────────────────────
// Times are in QUARTER-NOTE beats (the app-wide convention — SongDoc.beatsPerBar
// is quarter beats per bar, so 6/8 → 3 and 12/8 → 6). An eighth note is 0.5.

/** Vals — kick on 1, hi-hat on 2 and 3. The classic hymn waltz. */
export const vals: Groove = {
  id: 'vals',
  label: 'Vals 3/4',
  style: 'vals',
  timeSignature: '3/4',
  beatsPerBar: 3,
  lengthBeats: 3,
  bpmDefault: 90,
  difficulty: 1,
  hits: groove(at(K, 0.85, [0]), at(HH, 0.55, [1, 2])),
}

/** 6/8-ballade — full eighth carpet on the hi-hat, kick on the first pulse and
 * snare on the second (the 4th eighth = quarter-beat 1.5). */
export const ballade68: Groove = {
  id: 'ballade-68',
  label: '6/8-ballade',
  style: 'ballade68',
  timeSignature: '6/8',
  beatsPerBar: 3, // 6 eighths = 3 quarter beats
  lengthBeats: 3,
  bpmDefault: 63,
  difficulty: 2,
  hits: groove(
    at(K, 0.85, [0]),
    at(S, 0.8, [1.5]),
    pulse(HH, 0, 0.5, 6, 0.45, 3, 0.6), // all six eighths, accents on the pulses
  ),
}

/** 12/8-gospel-shuffle — ride plays the shuffle (first + third triplet eighth of
 * each dotted-quarter pulse), snare on pulses 2 & 4, kick on 1 & 3. Pulses land
 * every 1.5 quarter beats; a triplet eighth is 0.5. */
export const gospelShuffle128: Groove = {
  id: 'gospel-shuffle-128',
  label: '12/8-gospel-shuffle',
  style: 'shuffle',
  timeSignature: '12/8',
  beatsPerBar: 6, // 12 eighths = 6 quarter beats
  lengthBeats: 6,
  bpmDefault: 84,
  difficulty: 3,
  hits: groove(
    at(K, 0.85, [0, 3]),
    at(S, 0.9, [1.5, 4.5]),
    // Shuffled ride: skip the middle eighth of every triplet group.
    at(RD, 0.65, [0, 1.5, 3, 4.5]),
    at(RD, 0.5, [1, 2.5, 4, 5.5]),
  ),
}
