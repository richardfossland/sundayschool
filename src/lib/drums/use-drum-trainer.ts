'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePlayer } from '../store'
import { getEngine } from '../engine'
import { classifyHit, scoreSession, GOOD_MS, type SessionScore } from './timing'
import { laneOf } from './drum-lanes'
import type { DrumHit, HitResult } from './types'

// ── Drum play-along trainer ───────────────────────────────────────────────────
// While the transport runs, every strike (screen pad or e-drum MIDI) is judged
// against the nearest unjudged target hit in the SAME LANE using the ms windows
// in timing.ts. The strike's beat position is read from the store's
// `currentBeat` — the ONE time source — which the engine advances every
// animation frame, so the read is at most ~half a frame (≈8 ms) stale; well
// inside the ±40 ms perfect window's usable resolution.
//
//  • `results` is the CURRENT pass's verdict per target (parallel to `hits`) —
//    the falling canvas colours markers from it (green/amber/red).
//  • Targets that scroll past unhit turn 'miss' once they leave the late window.
//  • On loop wrap (beat jumps back) the pass finalises: remaining unjudged
//    targets count as misses, the per-pass colouring resets, and
//    `onPassComplete` fires (progress recording).
//  • Aggregate counts accumulate across passes until `reset`.

export interface DrumTrainer {
  /** Judge a strike in `laneIndex` right now. Returns the verdict (also when
   * the transport is stopped: null = free play, not judged). */
  strike: (laneIndex: number) => HitResult | null
  /** Current pass verdicts, parallel to `hits` (null = not judged yet). */
  results: (HitResult | null)[]
  /** Aggregate score across all passes since the last reset. */
  score: SessionScore
  reset: () => void
}

export function useDrumTrainer(
  hits: DrumHit[],
  opts: { onPassComplete?: (score: SessionScore) => void } = {},
): DrumTrainer {
  const [results, setResults] = useState<(HitResult | null)[]>(() => hits.map(() => null))
  const [all, setAll] = useState<HitResult[]>([])

  // Live refs so the beat listener and strike() never see stale state.
  const resultsRef = useRef(results)
  resultsRef.current = results
  const allRef = useRef(all)
  allRef.current = all
  const hitsRef = useRef(hits)
  hitsRef.current = hits
  const onPassRef = useRef(opts.onPassComplete)
  onPassRef.current = opts.onPassComplete
  const prevBeatRef = useRef(0)

  // New target list → new session.
  useEffect(() => {
    resultsRef.current = hits.map(() => null)
    allRef.current = []
    setResults(resultsRef.current)
    setAll([])
    prevBeatRef.current = 0
  }, [hits])

  const reset = useCallback(() => {
    resultsRef.current = hitsRef.current.map(() => null)
    allRef.current = []
    setResults(resultsRef.current)
    setAll([])
  }, [])

  // Follow the transport: mark passed-by targets as misses, finalise on wrap.
  useEffect(() => {
    const unsub = getEngine().onBeat((beat) => {
      const st = usePlayer.getState()
      if (!st.isPlaying) {
        prevBeatRef.current = beat
        return
      }
      const prev = prevBeatRef.current
      prevBeatRef.current = beat

      if (beat < prev - 0.5) {
        // Loop wrap — finalise the pass: unjudged targets are misses.
        const missed = resultsRef.current.filter((r) => r === null).length
        const nextAll = [...allRef.current, ...Array<HitResult>(missed).fill('miss')]
        allRef.current = nextAll
        resultsRef.current = hitsRef.current.map(() => null)
        setAll(nextAll)
        setResults(resultsRef.current)
        onPassRef.current?.(scoreSession(nextAll))
        return
      }

      // A target is definitively missed once the late window is behind us.
      const lateBeats = (GOOD_MS / 60000) * st.bpm
      const cur = resultsRef.current
      let next: (HitResult | null)[] | null = null
      let newMisses = 0
      const targets = hitsRef.current
      for (let i = 0; i < targets.length; i++) {
        if (cur[i] === null && targets[i].t + lateBeats < beat && targets[i].t > prev - 4) {
          if (!next) next = [...cur]
          next[i] = 'miss'
          newMisses++
        }
      }
      if (next) {
        resultsRef.current = next
        allRef.current = [...allRef.current, ...Array<HitResult>(newMisses).fill('miss')]
        setResults(next)
        setAll(allRef.current)
      }
    })
    return unsub
  }, [])

  const strike = useCallback((laneIndex: number): HitResult | null => {
    const st = usePlayer.getState()
    if (!st.isPlaying) return null // free play — no judging while stopped

    const beat = st.currentBeat
    const targets = hitsRef.current
    const cur = resultsRef.current

    // Nearest unjudged target in this lane.
    let best = -1
    let bestDist = Infinity
    for (let i = 0; i < targets.length; i++) {
      if (cur[i] !== null) continue
      if (laneOf(targets[i].p) !== laneIndex) continue
      const dist = Math.abs(targets[i].t - beat)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    }

    const verdict: HitResult = best >= 0 ? classifyHit(beat, targets[best].t, st.bpm) : 'miss'
    if (verdict !== 'miss' && best >= 0) {
      const next = [...cur]
      next[best] = verdict
      resultsRef.current = next // sync so a same-frame strike sees it consumed
      setResults(next)
    }
    // A stray strike (or one far from any target) still counts against the score.
    allRef.current = [...allRef.current, verdict]
    setAll(allRef.current)
    return verdict
  }, [])

  const score = useMemo(() => scoreSession(all), [all])

  return { strike, results, score, reset }
}
