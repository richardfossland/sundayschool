import type { Groove } from '@/lib/drums/types'
import { K, S, HH, OH, at, pulse, groove } from './_helpers.ts'

// ── 4/4 grooves ───────────────────────────────────────────────────────────────
// All hand-written and musically canonical: kick anchors beats 1 and 3, the
// snare backbeat sits on 2 and 4 (t = 1 and 3 — beats are 0-indexed quarter
// notes), and the hi-hat/ride carries the subdivision. Velocities: accents ~0.85,
// body ~0.7, hi-hat ~0.5, ghost notes ~0.35.

/** Salme enkel — the gentlest starting point: kick on 1 and 3, light quarter
 * hi-hat. No backbeat, so it sits politely under a hymn. */
export const salmeEnkel: Groove = {
  id: 'salme-enkel',
  label: 'Salme (enkel)',
  style: 'salme',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 76,
  difficulty: 1,
  hits: groove(at(K, 0.8, [0, 2]), pulse(HH, 0, 1, 4, 0.5)),
}

/** Gospel 8th — the bread-and-butter beat: straight eighth hi-hat, kick 1 & 3,
 * backbeat 2 & 4. */
export const gospel8: Groove = {
  id: 'gospel-8',
  label: 'Gospel 8-deler',
  style: 'gospel',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 96,
  difficulty: 1,
  hits: groove(
    at(K, 0.85, [0, 2]),
    at(S, 0.85, [1, 3]),
    pulse(HH, 0, 0.5, 8, 0.5, 2, 0.62), // eighths, accent on the quarters
  ),
}

/** Worship-pop — 16th hi-hat carpet, kick on 1 and the «and of 3». */
export const worshipPop16: Groove = {
  id: 'worship-pop-16',
  label: 'Worship-pop (16-deler)',
  style: 'worship',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 72,
  difficulty: 2,
  hits: groove(
    at(K, 0.85, [0, 2.5]),
    at(S, 0.85, [1, 3]),
    pulse(HH, 0, 0.25, 16, 0.42, 4, 0.6), // sixteenths, accent on the quarters
  ),
}

/** Ballade — soft eighth hi-hat, low-velocity snare on 2 & 4 (sidestick feel —
 * we have no separate sidestick sample, so the snare at v≈0.35 plays the role). */
export const ballade: Groove = {
  id: 'ballade',
  label: 'Ballade',
  style: 'ballade',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 66,
  difficulty: 1,
  hits: groove(
    at(K, 0.8, [0, 2.5]),
    at(S, 0.35, [1, 3]), // sidestick-like backbeat
    pulse(HH, 0, 0.5, 8, 0.45, 2, 0.55),
  ),
}

/** Halftime — the backbeat moves to beat 3 only; the open hi-hat pushes into the
 * next bar on the «and of 4». */
export const halftime: Groove = {
  id: 'halftime',
  label: 'Halftime',
  style: 'halftime',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 80,
  difficulty: 2,
  hits: groove(
    at(K, 0.85, [0, 3]),
    at(S, 0.9, [2]),
    pulse(HH, 0, 0.5, 7, 0.5, 2, 0.6), // eighths up to beat 4
    at(OH, 0.6, [3.5]), // open push into the repeat
  ),
}

/** Train beat — continuous snare sixteenths (brush-train feel): ghosted body
 * with accents on 2 & 4, kick on the quarters. */
export const trainBeat: Groove = {
  id: 'train-beat',
  label: 'Train-beat',
  style: 'train',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 104,
  difficulty: 2,
  hits: groove(
    at(K, 0.7, [0, 1, 2, 3]),
    // Sixteenth carpet on the snare, then bump the backbeats to full accents.
    pulse(S, 0, 0.25, 16, 0.35).map((h) => (h.t === 1 || h.t === 3 ? { ...h, v: 0.85 } : h)),
  ),
}

/** Gospel shout — uptempo four-on-the-floor with open hi-hat on every offbeat. */
export const gospelShout: Groove = {
  id: 'gospel-shout',
  label: 'Gospel shout',
  style: 'shout',
  timeSignature: '4/4',
  beatsPerBar: 4,
  lengthBeats: 4,
  bpmDefault: 126,
  difficulty: 3,
  hits: groove(
    at(K, 0.85, [0, 1, 2, 3]), // four on the floor
    at(S, 0.9, [1, 3]),
    at(OH, 0.6, [0.5, 1.5, 2.5, 3.5]), // offbeat open hats — the shout signature
  ),
}
