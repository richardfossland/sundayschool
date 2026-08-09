import { describe, it, expect, beforeEach } from 'vitest'
import { createBeatDriver, type FrameScheduler } from './useBeatDriven'
import { usePlayer } from './store'

// The scheduling contract behind finding S1. Four players used to subscribe to
// `currentBeat` and re-render their whole tree ~60×/s; the views now read the
// play-head through this driver instead. What must hold:
//   - an idle transport costs NOTHING (no frames requested),
//   - a moving transport is coalesced to `hz`,
//   - the LAST value of a move always arrives (a seek must never be swallowed),
//   - a frameless tab (hidden) delivers nothing, then delivers the CURRENT beat
//     — not a backlog — on the first frame after it comes back.

/** A hand-cranked frame clock: frames only happen when the test says so. */
function fakeFrames() {
  let next = 1
  let now = 0
  const queue = new Map<number, (t: number) => void>()
  const scheduler: FrameScheduler = {
    request: (cb) => {
      const id = next++
      queue.set(id, cb)
      return id
    },
    cancel: (id) => {
      queue.delete(id)
    },
  }
  return {
    scheduler,
    get requested() {
      return queue.size
    },
    /** Fire every queued frame at `now + advanceMs`. */
    frame(advanceMs = 16) {
      now += advanceMs
      const due = [...queue.entries()]
      queue.clear()
      for (const [, cb] of due) cb(now)
    },
  }
}

const setBeat = (b: number) => usePlayer.getState().set({ currentBeat: b })

describe('createBeatDriver', () => {
  beforeEach(() => {
    usePlayer.getState().set({ currentBeat: 0 })
  })

  it('delivers the current beat on the first frame', () => {
    setBeat(7)
    const seen: number[] = []
    const frames = fakeFrames()
    const dispose = createBeatDriver((b) => seen.push(b), 15, frames.scheduler)

    expect(seen).toEqual([]) // nothing before a frame
    frames.frame()
    expect(seen).toEqual([7])
    dispose()
  })

  it('requests no frames at all while the beat stands still', () => {
    const frames = fakeFrames()
    const dispose = createBeatDriver(() => {}, 15, frames.scheduler)
    frames.frame() // consume the initial delivery
    expect(frames.requested).toBe(0)

    // A store write that does NOT change the beat must not wake the driver.
    usePlayer.getState().setBpm(123)
    expect(frames.requested).toBe(0)
    dispose()
  })

  it('coalesces a burst of beats into one call per interval', () => {
    const seen: number[] = []
    const frames = fakeFrames()
    const dispose = createBeatDriver((b) => seen.push(b), 15, frames.scheduler) // 66.7 ms
    frames.frame(100) // initial delivery at t=100
    expect(seen).toEqual([0])

    // Ten engine writes across four 16 ms frames — well inside one interval.
    for (let i = 1; i <= 10; i++) {
      setBeat(i * 0.1)
      if (i % 3 === 0) frames.frame(16)
    }
    // Still inside the 66.7 ms window from t=100 → nothing new delivered yet.
    expect(seen).toEqual([0])

    frames.frame(40) // now past the interval
    expect(seen).toHaveLength(2)
    expect(seen[1]).toBeCloseTo(1.0) // the LATEST beat, not a queued old one
    dispose()
  })

  it('always delivers the final beat of a move (trailing edge)', () => {
    const seen: number[] = []
    const frames = fakeFrames()
    const dispose = createBeatDriver((b) => seen.push(b), 15, frames.scheduler)
    frames.frame(100)
    seen.length = 0

    setBeat(4) // e.g. a seek
    frames.frame(4) // too soon — the driver must re-arm, not drop it
    expect(seen).toEqual([])
    frames.frame(100)
    expect(seen).toEqual([4])
    dispose()
  })

  it('delivers the current beat — not a backlog — after a frameless gap', () => {
    const seen: number[] = []
    const frames = fakeFrames()
    const dispose = createBeatDriver((b) => seen.push(b), 15, frames.scheduler)
    frames.frame(100)
    seen.length = 0

    // Tab hidden: the engine keeps writing, no frames happen.
    for (let i = 1; i <= 50; i++) setBeat(i)
    expect(seen).toEqual([])

    frames.frame(5000) // tab shown again
    expect(seen).toEqual([50]) // exactly one call, the CURRENT beat
    dispose()
  })

  it('stops listening after dispose', () => {
    const seen: number[] = []
    const frames = fakeFrames()
    const dispose = createBeatDriver((b) => seen.push(b), 15, frames.scheduler)
    frames.frame(100)
    seen.length = 0
    dispose()

    setBeat(9)
    expect(frames.requested).toBe(0)
    frames.frame(100)
    expect(seen).toEqual([])
  })
})
