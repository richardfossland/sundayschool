// ── Lydteknikk — miksematematikk (ren modul) ─────────────────────────────────
// Pure, dependency-free helpers behind the mixing-desk lesson. NO Web Audio:
// everything here is plain arithmetic so it can be unit-tested in node and
// reused both by the visual MikserSim and by the lesson prose examples.
//
// Two worlds of "level" live side by side:
//   • dB (decibels) — how faders/EQ are labelled and how humans think.
//   • linear gain   — the multiplier a GainNode actually applies (1.0 = unity,
//                     0 = silence). 0 dB = gain 1.0, +6 dB ≈ ×2, −6 dB ≈ ÷2.
// dbToGain/gainToDb convert between them; the rest reason about clipping and
// headroom, which is the whole point of teaching gain-structure.

/** The three EQ bands the desk exposes, matching the BiquadFilter types used
 * in MikserSim (low shelf / peaking bell / high shelf). */
export type FilterType = 'lowshelf' | 'peaking' | 'highshelf'

/** dB → linear amplitude gain. 0 dB → 1, +6 → ~2, −6 → ~0.5, −∞ → 0. */
export function dbToGain(db: number): number {
  if (db === -Infinity) return 0
  return Math.pow(10, db / 20)
}

/** Linear amplitude gain → dB. gain 1 → 0 dB, 2 → +6, 0.5 → −6. A gain of 0
 * (or below) has no finite dB value and returns −Infinity (digital silence). */
export function gainToDb(gain: number): number {
  if (gain <= 0) return -Infinity
  return 20 * Math.log10(gain)
}

/** One channel's contribution as the clip test sees it. */
export interface ChannelLevel {
  /** Fader position in dB (−60…+12 on the desk). */
  gainDb: number
  /** The source's own peak amplitude, linear 0…1 (1 = a hot full-scale source). */
  sourceLevel: number
}

/**
 * Will the summed signal exceed digital full scale (clip) at the master?
 *
 * We sum the channels' LINEAR peak levels — worst case, in-phase (coherent)
 * summation, the loudest situation the desk can produce — then apply the master
 * fader. If the result passes 1.0 (0 dBFS) it clips. This deliberately ignores
 * phase cancellation between sources: it is the safe, pessimistic bound we want
 * a sound tech to design for.
 */
export function willClip(channels: ChannelLevel[], masterDb: number): boolean {
  const sum = channels.reduce((acc, c) => acc + c.sourceLevel * dbToGain(c.gainDb), 0)
  return sum * dbToGain(masterDb) > 1
}

/** Result of a gain-staging calculation across the signal chain. */
export interface GainStaging {
  /** dB left before clipping. Positive = safe margin; negative = already over. */
  headroom: number
  /** True once the summed chain passes 0 dBFS. */
  clipping: boolean
}

/**
 * Add up one source's journey through the chain and report the headroom.
 *
 * Every stage is expressed in dB relative to 0 dBFS (full scale), so a single
 * source's total is just the sum: source trim + fader + master. Headroom is how
 * far below the ceiling that lands (−total). A hot source (say −3 dBFS) with a
 * +2 dB fader and +2 dB master sits at +1 → 1 dB over → clipping, headroom −1.
 */
export function gainStaging(sourceDb: number, faderDb: number, masterDb: number): GainStaging {
  const total = sourceDb + faderDb + masterDb
  return { headroom: -total, clipping: total > 0 }
}

/**
 * Approximate the magnitude response (in dB) of one EQ band at a given
 * frequency — for DRAWING the EQ curve, not for DSP.
 *
 * ⚠️ SIMPLIFICATION: this is NOT the real RBJ/Audio-EQ-Cookbook biquad transfer
 * function. It ignores phase, passband ripple and the true coupling between
 * gain and Q. Instead:
 *   • peaking   → a Gaussian bell in log-frequency, width ≈ 1/Q octaves, peaking
 *                 at exactly `gainDb` on the centre frequency.
 *   • lowshelf  → a smooth logistic step: full `gainDb` well below `freq`,
 *                 tapering to 0 well above. Q steepens the transition.
 *   • highshelf → the mirror image: full `gainDb` well above `freq`.
 * The shape matches a real EQ closely enough to teach "boost/cut here" and to
 * render a believable curve; a boost of `gainDb` reads back as `gainDb` at the
 * centre/corner and monotonically decays away from it.
 *
 * @param atFreq the frequency (Hz) to evaluate the curve at
 * @returns the band's contribution at `atFreq`, in dB
 */
export function biquadResponse(
  type: FilterType,
  freq: number,
  gainDb: number,
  q: number,
  atFreq: number,
): number {
  // Distance from the corner/centre, measured in octaves (the ear's scale).
  const octaves = Math.log2(atFreq / freq)

  if (type === 'peaking') {
    // Gaussian bell; width in octaves ≈ 1/Q, so higher Q = narrower bell.
    const width = 1 / Math.max(q, 0.05)
    return gainDb * Math.exp(-0.5 * (octaves / width) * (octaves / width))
  }

  // Shelves: logistic transition roughly one octave wide, sharpened by Q.
  const steep = Math.max(q, 0.05) * 2
  if (type === 'lowshelf') {
    // octaves ≪ 0 (below corner) → 1; octaves ≫ 0 → 0.
    return gainDb * (1 / (1 + Math.exp(steep * octaves)))
  }
  // highshelf: octaves ≫ 0 (above corner) → 1; below → 0.
  return gainDb * (1 / (1 + Math.exp(-steep * octaves)))
}
