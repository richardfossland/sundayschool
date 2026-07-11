// ── Drum lanes (Trommer) ──────────────────────────────────────────────────────
//
// The on-screen kit is laid out as vertical LANES, kick on the LEFT and ride on
// the RIGHT (roughly following a drummer's kit read low→bright). We use ONE lane
// per playable GM piece in the instrument register (36,38,41,42,45,46,48,49,51),
// i.e. 9 lanes — deliberately NOT merging the three toms into one, so tom fills
// (rolls) stay visually distinct in the falling view and each pad is a real,
// separate drum. Every lane folds in the common GM aliases (e.g. 35→kick, 40→
// electric snare, 44→pedal hi-hat) so an e-drum that sends a slightly different
// pitch still lands in the right lane.
//
// `padPitch` is the CANONICAL pitch we actually trigger + train against; it is
// always one of the pitches present in INSTRUMENTS.drums. `gmPitches` is the full
// set of inputs (incl. aliases) that map INTO this lane.

export interface DrumLane {
  id: string
  label: string // Norwegian UI label
  /** All GM percussion pitches (incl. aliases) that belong to this lane. */
  gmPitches: number[]
  /** The canonical pitch to trigger/train — always present in INSTRUMENTS.drums. */
  padPitch: number
}

// Ordered LEFT → RIGHT for both the pads and the falling lanes.
export const LANES: DrumLane[] = [
  { id: 'kick', label: 'Basstromme', gmPitches: [36, 35], padPitch: 36 },
  { id: 'snare', label: 'Skarptromme', gmPitches: [38, 40, 37], padPitch: 38 },
  { id: 'hihat', label: 'Hi-hat', gmPitches: [42, 44], padPitch: 42 },
  { id: 'hihatOpen', label: 'Åpen hi-hat', gmPitches: [46], padPitch: 46 },
  { id: 'tomLow', label: 'Gulvtom', gmPitches: [41, 43], padPitch: 41 },
  { id: 'tomMid', label: 'Tom (mid)', gmPitches: [45, 47], padPitch: 45 },
  { id: 'tomHigh', label: 'Tom (høy)', gmPitches: [48, 50], padPitch: 48 },
  { id: 'crash', label: 'Crash', gmPitches: [49, 57, 55], padPitch: 49 },
  { id: 'ride', label: 'Ride', gmPitches: [51, 59, 53], padPitch: 51 },
]

// Reverse index: every GM pitch (canonical + alias) → its lane index.
const LANE_OF = new Map<number, number>()
LANES.forEach((lane, i) => {
  for (const p of lane.gmPitches) LANE_OF.set(p, i)
})

/**
 * The lane index (0 = kick … 8 = ride) a GM percussion pitch belongs to, folding
 * in aliases. Returns `null` for a pitch we do not render (so callers can ignore
 * unmapped MIDI input rather than crash).
 */
export function laneOf(pitch: number): number | null {
  const i = LANE_OF.get(pitch)
  return i === undefined ? null : i
}

/** The lane a GM pitch belongs to (or null), as the full DrumLane. */
export function laneForPitch(pitch: number): DrumLane | null {
  const i = laneOf(pitch)
  return i === null ? null : LANES[i]
}
