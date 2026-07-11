import type { Groove } from '@/lib/drums/types'
import { K, S, HH, TL, TM, TH, at, groove, h } from './_helpers.ts'

// ── Fill library — one-bar (4/4) fills ────────────────────────────────────────
// A fill is authored as a COMPLETE bar (kick/hi-hat skeleton for the first half,
// the fill itself in the second half), so the drum-track generator can swap it in
// for the last bar before a section boundary 1:1. Fills are also playable as
// practice patterns in their own right, so they share the Groove shape. For
// non-4/4 songs the generator synthesises a simple fill instead (drum-track.ts).

const T = 1 / 3 // one triplet eighth, in quarter beats

/** Enkel snarefill — backbeat bar that opens into snare eighths on beats 3–4. */
export const fillSnare: Groove = {
  id: 'fill-snare',
  label: 'Fill: snare-åttedeler',
  style: 'fill',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 90,
  difficulty: 1,
  hits: groove(
    at(K, 0.8, [0]),
    at(HH, 0.5, [0, 0.5, 1, 1.5]),
    at(S, 0.8, [1]),
    // The fill: rising eighths into the next downbeat.
    [h(2, S, 0.6), h(2.5, S, 0.68), h(3, S, 0.78), h(3.5, S, 0.88)],
  ),
}

/** Tom-rundgang — snare sixteenths on beat 3, then down the toms on beat 4. */
export const fillTommer: Groove = {
  id: 'fill-tommer',
  label: 'Fill: tom-rundgang',
  style: 'fill',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 90,
  difficulty: 2,
  hits: groove(
    at(K, 0.8, [0]),
    at(HH, 0.5, [0, 0.5, 1, 1.5]),
    at(S, 0.8, [1]),
    at(S, 0.7, [2, 2.25, 2.5, 2.75]),
    // High → mid → low around the kit.
    [h(3, TH, 0.8), h(3.25, TH, 0.7), h(3.5, TM, 0.8), h(3.75, TL, 0.85)],
  ),
}

/** Triolfill — gospel-flavoured triplets over beats 3–4, landing low. */
export const fillTrioler: Groove = {
  id: 'fill-trioler',
  label: 'Fill: trioler',
  style: 'fill',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 84,
  difficulty: 3,
  hits: groove(
    at(K, 0.8, [0]),
    at(HH, 0.5, [0, 0.5, 1, 1.5]),
    at(S, 0.8, [1]),
    // Two triplet groups: snare on beat 3, toms on beat 4.
    [h(2, S, 0.75), h(2 + T, S, 0.65), h(2 + 2 * T, S, 0.7)],
    [h(3, TH, 0.8), h(3 + T, TM, 0.78), h(3 + 2 * T, TL, 0.85)],
  ),
}
