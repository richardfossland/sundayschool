'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '@/lib/store'

// ── useBeatDriven — reading the play-head WITHOUT re-rendering the tree ───────
//
// The engine writes `currentBeat` into the store on every animation frame. Any
// component that selects it with `usePlayer((s) => s.currentBeat)` therefore
// re-renders ~60×/s — and if that component is an orchestrator (SongPlayer,
// GuitarPlayer, BassPlayer, DrumsPlayer), so does everything below it.
//
// The canvases already avoid this: FallingNotes/FallingChords run their own rAF
// loop and read `usePlayer.getState()` inside it, so React never sees the beat.
// This module gives the *DOM* views the same deal:
//
//   useBeatDriven(cb)      — call `cb(beat)` at most `hz` times per second,
//                            only while the beat is actually moving. No render.
//   useBeatValue(compute)  — derive a value from the beat and re-render ONLY
//                            when that value changes (the sounding key set, the
//                            active chord index, …), not when the beat does.
//
// The throttle is leading-edge with a guaranteed trailing call: every store
// write schedules a frame, so the LAST beat of a move (a seek, a stop, the end
// of a pass) always lands within 1/hz s. Nothing is dropped, only coalesced.

/** Default UI refresh rate. 15 Hz is well under a frame budget yet fast enough
 * that a key lighting up still reads as "on the beat" (≤67 ms). */
export const BEAT_HZ = 15

/** The frame clock the driver runs on. Injectable so the scheduling rules can
 * be tested in Node — the browser default is requestAnimationFrame. */
export interface FrameScheduler {
  request: (cb: (now: number) => void) => number
  cancel: (id: number) => void
}

const rafScheduler: FrameScheduler = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
}

/**
 * Subscribe to the store's `currentBeat` and deliver it to `cb` at most `hz`
 * times per second, on frame boundaries. Returns a dispose function.
 *
 * The rules, all of which the tests pin down:
 *  - The current value is delivered once on start.
 *  - While the beat is moving, `cb` is called at most every 1000/hz ms; the
 *    intervening values are COALESCED, never queued up.
 *  - The last value of a move is always delivered (trailing edge): every store
 *    write re-arms the pending flag, so a seek or a stop is never swallowed.
 *  - When the beat stands still, no frame is requested at all — an idle player
 *    costs nothing.
 *  - A hidden tab has no frames, so nothing is delivered; the pending flag
 *    survives, and the first frame after the tab is shown delivers the CURRENT
 *    beat (not a stale backlog).
 */
export function createBeatDriver(
  cb: (beat: number) => void,
  hz: number = BEAT_HZ,
  scheduler: FrameScheduler = rafScheduler,
): () => void {
  const interval = 1000 / hz
  let frame = 0
  let lastRun = -Infinity
  let pending = true // deliver the current value once on start

  const tick = (now: number) => {
    frame = 0
    if (!pending) return
    if (now - lastRun < interval) {
      // Too soon — wait one frame rather than dropping the update.
      frame = scheduler.request(tick)
      return
    }
    lastRun = now
    pending = false
    cb(usePlayer.getState().currentBeat)
  }

  const schedule = () => {
    pending = true
    if (!frame) frame = scheduler.request(tick)
  }

  schedule()
  const unsub = usePlayer.subscribe((s, prev) => {
    if (s.currentBeat !== prev.currentBeat) schedule()
  })

  return () => {
    unsub()
    if (frame) scheduler.cancel(frame)
  }
}

/**
 * Run `cb` with the live `currentBeat`, frame-throttled to `hz`, without ever
 * re-rendering the caller. `cb` may close over fresh props — it is re-read from
 * a ref on every tick, so it never goes stale and never re-installs the
 * subscription.
 */
export function useBeatDriven(cb: (beat: number) => void, hz: number = BEAT_HZ): void {
  const cbRef = useRef(cb)
  cbRef.current = cb

  useEffect(() => createBeatDriver((beat) => cbRef.current(beat), hz), [hz])
}

interface BeatValueOptions<T> {
  hz?: number
  /** Custom equality — the whole point is to NOT re-render on an equal value. */
  isEqual?: (a: T, b: T) => boolean
}

/**
 * Derive a value from the live play-head. The component re-renders only when
 * `compute` returns something new by `isEqual` (default `Object.is`), so a
 * keyboard re-renders when the sounding notes change — not 60×/s.
 *
 * `deps` behaves like a `useMemo` dependency list: when it changes the value is
 * recomputed immediately (the beat may be standing still).
 */
export function useBeatValue<T>(
  compute: (beat: number) => T,
  deps: React.DependencyList = [],
  options: BeatValueOptions<T> = {},
): T {
  const { hz = BEAT_HZ, isEqual } = options

  const computeRef = useRef(compute)
  computeRef.current = compute
  const eqRef = useRef(isEqual)
  eqRef.current = isEqual

  const [value, setValue] = useState<T>(() => compute(usePlayer.getState().currentBeat))
  const valueRef = useRef(value)
  valueRef.current = value

  const commit = (beat: number) => {
    const next = computeRef.current(beat)
    const eq = eqRef.current ?? Object.is
    if (eq(valueRef.current, next)) return
    valueRef.current = next
    setValue(next)
  }
  const commitRef = useRef(commit)
  commitRef.current = commit

  // Recompute when the inputs change even though the beat did not (a new song,
  // a transposition, a hand filter) — otherwise the view freezes on stale data
  // until the next transport tick.
  useEffect(() => {
    commitRef.current(usePlayer.getState().currentBeat)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useBeatDriven((beat) => commitRef.current(beat), hz)

  return value
}

/**
 * Fire `onWrap` when the play-head jumps backwards during playback — i.e. an
 * A-B loop (or the whole song) wrapped to the top and a pass completed. Shared
 * by the instrument orchestrators, which record practice on every pass.
 */
export function useLoopWrap(onWrap: () => void, hz: number = BEAT_HZ): void {
  const prevRef = useRef(0)
  useBeatDriven((beat) => {
    if (!usePlayer.getState().isPlaying) {
      prevRef.current = beat
      return
    }
    // Half a beat of slack: at 15 Hz and 180 BPM one tick advances 0.2 beats,
    // so only a real jump back trips this.
    if (beat < prevRef.current - 0.5) onWrap()
    prevRef.current = beat
  }, hz)
}
