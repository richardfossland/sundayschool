import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SongDoc } from '@/types/song'

// ── Engine transport lifecycle (Tone mocked) ─────────────────────────────────
//
// engine.ts is the one module that cannot be tested in the browser: the pieces
// that matter here — the one-shot end-stop and what a route change tears down —
// are invisible until the SECOND playback. So we drive a fake Transport and
// assert the bookkeeping directly.
//
// The whole fake runs as a FULLY BACKGROUNDED TAB: requestAnimationFrame hands
// out ids but never calls anything back, and Tone.Draw (which is rAF under the
// hood) only records what it was handed. Everything below therefore proves the
// transport lifecycle without a single frame — which is the point: the end-stop
// used to be delivered through Tone.Draw, so a hidden tab reached the end of the
// song and just kept rolling, isPlaying stuck on until someone looked at it.

/** The fake Transport, rebuilt per test. */
const transport = {
  PPQ: 192,
  bpm: { value: 120 },
  loop: false,
  loopStart: '0i',
  loopEnd: '0i',
  position: 0,
  ticks: 0,
  /** Scheduled one-shots: id → callback. Cleared ids are removed. */
  once: new Map<number, (time: number) => void>(),
  nextId: 1,
  scheduleOnce: vi.fn((cb: (time: number) => void) => {
    const id = transport.nextId++
    transport.once.set(id, cb)
    return id
  }),
  scheduleRepeat: vi.fn(() => transport.nextId++),
  clear: vi.fn((id: number) => void transport.once.delete(id)),
  start: vi.fn(),
  stop: vi.fn(),
  getTicksAtTime: vi.fn(() => 0),
}

/**
 * Fire the scheduled end-stop the way Tone does: the event is REMOVED first
 * (scheduleOnce is one-shot), then the callback runs. This is the exact
 * behaviour that made the second playback never stop.
 */
function fireEndStop() {
  const entries = [...transport.once.entries()]
  expect(entries.length).toBe(1) // exactly one end-stop armed
  const [id, cb] = entries[0]
  transport.once.delete(id)
  cb(0)
}

/** Frames the beat clock has asked for and will never get (hidden tab). */
const pendingFrames: FrameRequestCallback[] = []
/** Callbacks handed to Tone.Draw. Draw is rAF, so these never run either. */
const drawCalls: (() => void)[] = []

class FakeNode {
  disposed = false
  connect() {
    return this
  }
  toDestination() {
    return this
  }
  dispose() {
    this.disposed = true
  }
  triggerAttackRelease() {}
  volume = { value: 0 }
}
class FakePlayers extends FakeNode {
  has() {
    return false
  }
  player() {
    return { volume: { value: 0 }, start() {} }
  }
}
class FakePart extends FakeNode {
  start() {
    return this
  }
}

vi.mock('tone', () => ({
  get Transport() {
    return transport
  },
  Sampler: FakeNode,
  Players: FakePlayers,
  Volume: FakeNode,
  MembraneSynth: FakeNode,
  Part: FakePart,
  // Draw is requestAnimationFrame: in a hidden tab it never delivers. Recording
  // instead of running is what makes "no rAF anywhere" assertable.
  Draw: { schedule: (cb: () => void) => void drawCalls.push(cb) },
  Frequency: () => ({ toFrequency: () => 440 }),
  gainToDb: () => 0,
  now: () => 0,
  loaded: () => Promise.resolve(),
}))

vi.mock('./audio-unlock', () => ({
  ensureAudioRunning: vi.fn(async () => {}),
  installAudioUnlock: vi.fn(),
}))

const { getEngine } = await import('./engine')
const { usePlayer } = await import('./store')

const doc = (): SongDoc => ({
  formatVersion: 1,
  timeSignature: '4/4',
  beatsPerBar: 4,
  pickupBeats: 0,
  totalBeats: 16,
  keySignature: 'C',
  sections: [{ id: 's1', kind: 'verse', label: 'Del 1', startBeat: 0, endBeat: 16 }],
  notes: [{ p: 60, t: 0, d: 1, h: 'R' }],
  chords: [],
})

const build = (loop = false) =>
  getEngine().build(doc(), { hand: 'both', bpm: 100, loop, transpose: 0 })

beforeEach(() => {
  transport.once.clear()
  // nextId is deliberately NOT reset: the engine is a singleton and carries ids
  // (metro, end-stop) across tests, so reusing ids would let one test's clear()
  // delete another's event.
  transport.scheduleOnce.mockClear()
  transport.stop.mockClear()
  transport.start.mockClear()
  usePlayer.getState().set({ isPlaying: false, currentBeat: 0, countIn: false })
  pendingFrames.length = 0
  drawCalls.length = 0
  // A hidden tab: frames are handed out and never delivered. (This also keeps
  // tick() from recursing.)
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    pendingFrames.push(cb)) as typeof requestAnimationFrame
  globalThis.cancelAnimationFrame = (() => {}) as typeof cancelAnimationFrame
})

describe('end-stop re-arming', () => {
  it('stops the FIRST playback at the end of the song', async () => {
    build()
    await getEngine().play()
    expect(usePlayer.getState().isPlaying).toBe(true)
    fireEndStop()
    expect(transport.stop).toHaveBeenCalled()
    expect(usePlayer.getState().isPlaying).toBe(false)
  })

  it('stops the SECOND playback too — the one-shot is re-armed on play', async () => {
    build()
    await getEngine().play()
    fireEndStop() // first pass reaches the end; Tone drops the event
    expect(transport.once.size).toBe(0)

    // Press play again. Without re-arming there is nothing left to stop it:
    // the transport would run past the end forever, isPlaying stuck on, and
    // every wrap-around re-recording practice.
    await getEngine().play()
    expect(transport.once.size).toBe(1)
    fireEndStop()
    expect(usePlayer.getState().isPlaying).toBe(false)
  })

  it('stops a fully backgrounded tab — the end-stop needs no frame at all', async () => {
    build()
    await getEngine().play()
    const beats: number[] = []
    const unsub = getEngine().onBeat((b) => beats.push(b))
    expect(usePlayer.getState().isPlaying).toBe(true)
    // The beat clock DID ask for a frame — and, this being a hidden tab, will
    // never get it. Nothing below is allowed to depend on that frame arriving.
    expect(pendingFrames.length).toBeGreaterThan(0)

    fireEndStop()

    // The stop must have travelled the audio-scheduling path, not the drawing
    // one: Tone.Draw was never handed anything, and no frame ever ran.
    expect(drawCalls).toEqual([])
    expect(transport.stop).toHaveBeenCalled()
    // …and the UI state is settled without a frame: the store is updated and
    // the beat listeners (the score marker) were told to go home.
    expect(usePlayer.getState().isPlaying).toBe(false)
    expect(usePlayer.getState().currentBeat).toBe(0)
    expect(beats).toEqual([0])
    unsub()
  })

  it('survives a Stop press landing in the same instant as the end-stop', async () => {
    // stop() is re-entrant: the end-stop fires from a Transport callback while
    // the learner may be hitting the stop button, so a second pass must be a
    // no-op rather than clearing someone else's scheduled event.
    build()
    await getEngine().play()
    fireEndStop()
    getEngine().stop() // the button press, one beat too late
    expect(transport.stop).toHaveBeenCalledTimes(2)
    expect(usePlayer.getState().isPlaying).toBe(false)
    // The spent one-shot is gone and nothing re-armed or re-cleared behind it.
    expect(transport.once.size).toBe(0)
  })

  it('never arms an end-stop while looping', async () => {
    build(true)
    await getEngine().play()
    expect(transport.once.size).toBe(0)
    await getEngine().play()
    expect(transport.once.size).toBe(0)
  })

  it('follows a live loop toggle in both directions', async () => {
    build(true)
    getEngine().setLoop(false)
    await getEngine().play()
    expect(transport.once.size).toBe(1)
    getEngine().setLoop(true)
    expect(transport.once.size).toBe(0)
  })
})

describe('release() vs dispose()', () => {
  it('release keeps the loaded samplers and the beat listeners', async () => {
    build()
    await getEngine().play()
    const beats: number[] = []
    const unsub = getEngine().onBeat((b) => beats.push(b))

    getEngine().release()
    expect(transport.stop).toHaveBeenCalled()
    expect(beats).toEqual([0]) // stop() notified the listener — still subscribed

    // A listener registered before the route change still hears the next song.
    build()
    getEngine().seekTo(4)
    expect(beats).toEqual([0, 4])
    unsub()
  })

  it('release keeps the decoded samples — a route change must not re-load them', async () => {
    getEngine().dispose() // start from cold
    build()
    await getEngine().play()
    expect(usePlayer.getState().isLoading).toBe(false)

    // Leaving one song and opening another: the sampler is already there, so
    // ensureInstrument never flips isLoading and never rebuilds the node.
    getEngine().release()
    build()
    usePlayer.getState().set({ isLoading: false })
    let sawLoading = false
    const unsub = usePlayer.subscribe((s) => {
      if (s.isLoading) sawLoading = true
    })
    await getEngine().play()
    unsub()
    expect(sawLoading).toBe(false)
  })

  it('release drops the end-stop so it cannot fire into a torn-down song', async () => {
    build()
    await getEngine().play()
    expect(transport.once.size).toBe(1)
    getEngine().release()
    expect(transport.once.size).toBe(0)
  })

  it('dispose is the full teardown — listeners included', async () => {
    build()
    await getEngine().play()
    const beats: number[] = []
    getEngine().onBeat((b) => beats.push(b))
    getEngine().dispose()
    beats.length = 0
    getEngine().seekTo(2)
    expect(beats).toEqual([]) // unsubscribed by the teardown
  })
})
