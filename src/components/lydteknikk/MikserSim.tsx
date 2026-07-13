'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as Tone from 'tone'
import { Play, Square, Speaker, Headphones } from 'lucide-react'
import { ensureAudioRunning, installAudioUnlock } from '@/lib/audio-unlock'
import { biquadResponse, dbToGain } from '@/lib/lydteknikk/mixer-math'
import { cn } from '@/lib/cn'

// ── MikserSim ─────────────────────────────────────────────────────────────────
// A small, self-contained Web Audio mixing desk for the sound-tech lessons. It
// builds its OWN audio graph on demand (after a click, so iOS audio is already
// unlocked) — completely independent of the app's SongEngine. It reuses the
// shared, already-unlocked AudioContext (Tone.getContext().rawContext) so it
// benefits from installAudioUnlock, but it never touches Tone's transport.
//
// Signal flow, per channel (Trommer / Bass / Vokal):
//   source(s) → [bass: lowpass] → lowShelf → peaking → highShelf → postEQ
//     postEQ → fader(gain) → meter(analyser) → FOH-buss
//     postEQ → monitor-send(gain) → Monitor-buss
//   FOH-buss  → FOH-master  → FOH-listen  → root → destination
//   Monitor-buss → Mon-master → Mon-listen → root → destination
// "Lytt: Sal / Monitor" crossfades the two listen-gates so you HEAR either the
// house mix or the (separately balanced) monitor mix. The master meter + clip
// lamp always watch the FOH master sum (the mains — what actually clips).
//
// Everything is torn down on Stopp / unmount; the SHARED context is never
// closed, only our subgraph is disconnected and all oscillators stopped.

// ── Channel + pattern config ──────────────────────────────────────────────────
interface ChannelCfg {
  id: 'drums' | 'bass' | 'vocal'
  label: string
  hint: string
}
const CHANNELS: ChannelCfg[] = [
  { id: 'drums', label: 'Trommer', hint: 'Kick, skarp, hihat' },
  { id: 'bass', label: 'Bass', hint: 'Firkant + lavpass' },
  { id: 'vocal', label: 'Vokal', hint: 'Sinus-melodi (stedfortreder)' },
]

const FADER_MIN = -60
const FADER_MAX = 12
const EQ_RANGE = 12 // ±12 dB per band

// One-bar loop at 100 BPM, 4/4.
const BPM = 100
const SPB = 60 / BPM // seconds per beat
const BAR = 4 * SPB

const DRUM_HITS: { pitch: 36 | 38 | 42; beat: number; gain: number }[] = [
  { pitch: 36, beat: 0, gain: 0.9 },
  { pitch: 36, beat: 2, gain: 0.9 },
  { pitch: 38, beat: 1, gain: 0.7 },
  { pitch: 38, beat: 3, gain: 0.7 },
  ...[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((beat) => ({ pitch: 42 as const, beat, gain: 0.35 })),
]
const BASS_NOTES = [
  { beat: 0, freq: 110.0 },
  { beat: 1, freq: 110.0 },
  { beat: 2, freq: 82.41 },
  { beat: 3, freq: 82.41 },
]
const VOCAL_NOTES = [
  { beat: 0, freq: 329.63 },
  { beat: 1, freq: 392.0 },
  { beat: 2, freq: 440.0 },
  { beat: 3, freq: 392.0 },
]

// EQ band definitions (match the BiquadFilter setup + biquadResponse curve).
const BANDS = [
  { key: 'low' as const, type: 'lowshelf' as const, freq: 200, q: 0.7, label: 'Lav' },
  { key: 'mid' as const, type: 'peaking' as const, freq: 1000, q: 1, label: 'Mid' },
  { key: 'high' as const, type: 'highshelf' as const, freq: 5000, q: 0.7, label: 'Topp' },
]

interface EqState {
  low: number
  mid: number
  high: number
}
interface ChannelState {
  faderDb: number
  eq: EqState
  monSendDb: number
}

// ── Live audio graph (kept in a ref, off React's render path) ─────────────────
interface ChannelNodes {
  input: AudioNode // where sources connect (bass: lowpass; else: lowShelf)
  low: BiquadFilterNode
  mid: BiquadFilterNode
  high: BiquadFilterNode
  fader: GainNode
  monSend: GainNode
  meter: AnalyserNode
}
interface Graph {
  ctx: AudioContext
  root: GainNode
  channels: ChannelNodes[]
  fohMaster: GainNode
  monMaster: GainNode
  fohListen: GainNode
  monListen: GainNode
  masterMeter: AnalyserNode
  drumBuffers: Record<number, AudioBuffer>
  activeSources: Set<AudioScheduledSourceNode>
  scheduleTimer: number
  raf: number
  nextBarTime: number
}

const DEFAULT_CHANNELS: ChannelState[] = [
  { faderDb: -6, eq: { low: 0, mid: 0, high: 0 }, monSendDb: -12 },
  { faderDb: -8, eq: { low: 0, mid: 0, high: 0 }, monSendDb: -18 },
  // Vokal starts pulled all the way down — the "få vokalen hørbar" task.
  { faderDb: FADER_MIN, eq: { low: 0, mid: 0, high: 0 }, monSendDb: -6 },
]

export function MikserSim() {
  const [mounted, setMounted] = useState(false)
  const [running, setRunning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listen, setListen] = useState<'sal' | 'monitor'>('sal')
  const [master, setMaster] = useState(0)
  const [monMaster, setMonMaster] = useState(0)
  const [channels, setChannels] = useState<ChannelState[]>(() =>
    DEFAULT_CHANNELS.map((c) => ({ ...c, eq: { ...c.eq } })),
  )
  // Meters: per-channel + master peak (0..1) and the held clip lamp.
  const [meters, setMeters] = useState<{ ch: number[]; master: number; clip: boolean }>({
    ch: [0, 0, 0],
    master: 0,
    clip: false,
  })

  const graphRef = useRef<Graph | null>(null)
  const clipUntilRef = useRef(0)

  useEffect(() => {
    setMounted(true)
    installAudioUnlock()
  }, [])

  // Tear the graph down if the component unmounts while playing.
  useEffect(() => {
    return () => teardown(graphRef.current)
  }, [])

  async function start() {
    if (running || busy) return
    setBusy(true)
    setError(null)
    try {
      await ensureAudioRunning()
      const ctx = Tone.getContext().rawContext as unknown as AudioContext

      // Load the three drum one-shots (reusing the app's self-hosted samples).
      const drumBuffers = await loadDrums(ctx)

      const graph = buildGraph(ctx, drumBuffers, channels, master, monMaster, listen)
      graphRef.current = graph
      startScheduler(graph)
      startMeters(graph, clipUntilRef, setMeters)
      setRunning(true)
    } catch (e) {
      setError('Klarte ikke å starte lyd. Prøv igjen, eller sjekk at nettleseren tillater lyd.')
      teardown(graphRef.current)
      graphRef.current = null
      // eslint-disable-next-line no-console
      console.error('MikserSim start failed', e)
    } finally {
      setBusy(false)
    }
  }

  function stop() {
    teardown(graphRef.current)
    graphRef.current = null
    setRunning(false)
    setMeters({ ch: [0, 0, 0], master: 0, clip: false })
  }

  // ── Live parameter updates (state + AudioParam together) ────────────────────
  const now = () => graphRef.current?.ctx.currentTime ?? 0

  function updateFader(i: number, db: number) {
    setChannels((cs) => cs.map((c, j) => (j === i ? { ...c, faderDb: db } : c)))
    graphRef.current?.channels[i].fader.gain.setTargetAtTime(dbToGain(db), now(), 0.01)
  }
  function updateMonSend(i: number, db: number) {
    setChannels((cs) => cs.map((c, j) => (j === i ? { ...c, monSendDb: db } : c)))
    graphRef.current?.channels[i].monSend.gain.setTargetAtTime(dbToGain(db), now(), 0.01)
  }
  function updateEq(i: number, band: keyof EqState, db: number) {
    setChannels((cs) => cs.map((c, j) => (j === i ? { ...c, eq: { ...c.eq, [band]: db } } : c)))
    const node = graphRef.current?.channels[i][band]
    node?.gain.setTargetAtTime(db, now(), 0.01)
  }
  function updateMaster(db: number) {
    setMaster(db)
    graphRef.current?.fohMaster.gain.setTargetAtTime(dbToGain(db), now(), 0.01)
  }
  function updateMonMaster(db: number) {
    setMonMaster(db)
    graphRef.current?.monMaster.gain.setTargetAtTime(dbToGain(db), now(), 0.01)
  }
  function updateListen(v: 'sal' | 'monitor') {
    setListen(v)
    const g = graphRef.current
    if (!g) return
    const t = g.ctx.currentTime
    g.fohListen.gain.setTargetAtTime(v === 'sal' ? 1 : 0, t, 0.02)
    g.monListen.gain.setTargetAtTime(v === 'monitor' ? 1 : 0, t, 0.02)
  }

  if (!mounted) {
    // SSR / pre-hydration placeholder keeps layout stable.
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted)]">
        Laster miksepult …
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
      style={{ ['--fag' as string]: 'var(--fag-lydteknikk)' }}
    >
      {/* Transport row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {!running ? (
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--color-scene)] transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--fag)' }}
          >
            <Play className="h-4 w-4" />
            {busy ? 'Starter …' : 'Start miksepulten'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ivory)] transition-colors hover:bg-[var(--color-raised)]"
          >
            <Square className="h-4 w-4" />
            Stopp
          </button>
        )}

        {/* Lytt: Sal / Monitor */}
        <div className="inline-flex items-center overflow-hidden rounded-full border border-[var(--color-border)]">
          <ListenButton
            active={listen === 'sal'}
            onClick={() => updateListen('sal')}
            icon={<Speaker className="h-4 w-4" />}
            label="Sal"
          />
          <ListenButton
            active={listen === 'monitor'}
            onClick={() => updateListen('monitor')}
            icon={<Headphones className="h-4 w-4" />}
            label="Monitor"
          />
        </div>

        {/* Clip lamp */}
        <div className="ml-auto inline-flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]">
          <span
            aria-hidden
            className="h-3 w-3 rounded-full transition-colors"
            style={{
              backgroundColor: meters.clip ? 'var(--color-danger)' : 'var(--color-border)',
              boxShadow: meters.clip ? '0 0 10px 2px var(--color-danger)' : 'none',
            }}
          />
          {meters.clip ? 'CLIP' : 'OK'}
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-raised)] px-3 py-2 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}

      {/* Channel strips + master */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {CHANNELS.map((cfg, i) => (
          <ChannelStrip
            key={cfg.id}
            cfg={cfg}
            state={channels[i]}
            level={meters.ch[i]}
            onFader={(db) => updateFader(i, db)}
            onMonSend={(db) => updateMonSend(i, db)}
            onEq={(band, db) => updateEq(i, band, db)}
          />
        ))}
        <MasterStrip
          master={master}
          monMaster={monMaster}
          level={meters.master}
          clip={meters.clip}
          onMaster={updateMaster}
          onMonMaster={updateMonMaster}
        />
      </div>

      {!running && (
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Trykk «Start miksepulten» for å høre bandet. Alt spilles i nettleseren — ingenting sendes
          noe sted.
        </p>
      )}
    </div>
  )
}

// ── UI subcomponents ──────────────────────────────────────────────────────────

function ListenButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'text-[var(--color-scene)]' : 'text-[var(--color-muted)] hover:text-[var(--color-ivory)]',
      )}
      style={active ? { backgroundColor: 'var(--fag)' } : undefined}
    >
      {icon}
      {label}
    </button>
  )
}

function ChannelStrip({
  cfg,
  state,
  level,
  onFader,
  onMonSend,
  onEq,
}: {
  cfg: ChannelCfg
  state: ChannelState
  level: number
  onFader: (db: number) => void
  onMonSend: (db: number) => void
  onEq: (band: keyof EqState, db: number) => void
}) {
  return (
    <div className="flex min-w-[132px] flex-col items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
      <div className="text-center">
        <p className="font-display text-sm text-[var(--color-ivory)]">{cfg.label}</p>
        <p className="text-[10px] text-[var(--color-muted)]">{cfg.hint}</p>
      </div>

      <EqCurve eq={state.eq} />

      {/* Three EQ bands */}
      <div className="flex w-full flex-col gap-1.5">
        {BANDS.map((b) => (
          <label key={b.key} className="flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
            <span className="w-7 shrink-0">{b.label}</span>
            <input
              type="range"
              min={-EQ_RANGE}
              max={EQ_RANGE}
              step={1}
              value={state.eq[b.key]}
              onChange={(e) => onEq(b.key, Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer"
              style={{ accentColor: 'var(--fag)' }}
              aria-label={`${cfg.label} EQ ${b.label}`}
            />
            <span className="w-8 shrink-0 text-right tabular-nums text-[var(--color-ivory)]">
              {state.eq[b.key] > 0 ? '+' : ''}
              {state.eq[b.key]}
            </span>
          </label>
        ))}
      </div>

      {/* Fader + meter */}
      <div className="mt-1 flex items-end gap-2">
        <Meter level={level} />
        <div className="flex flex-col items-center">
          <input
            type="range"
            min={FADER_MIN}
            max={FADER_MAX}
            step={1}
            value={state.faderDb}
            onChange={(e) => onFader(Number(e.target.value))}
            className="h-32 cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: 'var(--fag)' }}
            aria-label={`${cfg.label} fader`}
          />
          <span className="mt-1 tabular-nums text-[10px] text-[var(--color-ivory)]">
            {state.faderDb <= FADER_MIN ? '−∞' : `${state.faderDb > 0 ? '+' : ''}${state.faderDb}`} dB
          </span>
        </div>
      </div>

      {/* Monitor send */}
      <label className="flex w-full items-center gap-2 text-[10px] text-[var(--color-muted)]">
        <Headphones className="h-3 w-3 shrink-0" />
        <input
          type="range"
          min={FADER_MIN}
          max={FADER_MAX}
          step={1}
          value={state.monSendDb}
          onChange={(e) => onMonSend(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer"
          style={{ accentColor: 'var(--fag)' }}
          aria-label={`${cfg.label} monitor-send`}
        />
      </label>
    </div>
  )
}

function MasterStrip({
  master,
  monMaster,
  level,
  clip,
  onMaster,
  onMonMaster,
}: {
  master: number
  monMaster: number
  level: number
  clip: boolean
  onMaster: (db: number) => void
  onMonMaster: (db: number) => void
}) {
  return (
    <div
      className="flex min-w-[132px] flex-col items-center gap-2 rounded-xl border p-3"
      style={{
        borderColor: 'color-mix(in srgb, var(--fag) 45%, transparent)',
        backgroundColor: 'color-mix(in srgb, var(--fag) 8%, var(--color-raised))',
      }}
    >
      <div className="text-center">
        <p className="font-display text-sm text-[var(--color-ivory)]">Master</p>
        <p className="text-[10px] text-[var(--color-muted)]">Sal + monitor</p>
      </div>

      <div className="mt-1 flex items-end gap-2">
        <Meter level={level} tall clip={clip} />
        <div className="flex flex-col items-center">
          <input
            type="range"
            min={FADER_MIN}
            max={FADER_MAX}
            step={1}
            value={master}
            onChange={(e) => onMaster(Number(e.target.value))}
            className="h-40 cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl', accentColor: 'var(--fag)' }}
            aria-label="Sal-master fader"
          />
          <span className="mt-1 tabular-nums text-[10px] text-[var(--color-ivory)]">
            {master <= FADER_MIN ? '−∞' : `${master > 0 ? '+' : ''}${master}`} dB
          </span>
        </div>
      </div>

      <label className="flex w-full items-center gap-2 text-[10px] text-[var(--color-muted)]">
        <Headphones className="h-3 w-3 shrink-0" />
        <input
          type="range"
          min={FADER_MIN}
          max={FADER_MAX}
          step={1}
          value={monMaster}
          onChange={(e) => onMonMaster(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer"
          style={{ accentColor: 'var(--fag)' }}
          aria-label="Monitor-master fader"
        />
      </label>
    </div>
  )
}

/** A vertical peak meter. `level` is 0..1 linear peak. */
function Meter({ level, tall, clip }: { level: number; tall?: boolean; clip?: boolean }) {
  const pct = Math.min(100, Math.max(0, level * 100))
  // Green below ~70%, amber toward the top, red past ~92% (approaching clip).
  const color = pct > 92 ? 'var(--color-danger)' : pct > 70 ? 'var(--color-amber)' : 'var(--color-sea)'
  return (
    <div
      className={cn(
        'relative w-2.5 overflow-hidden rounded-full bg-[var(--color-black-key)]',
        tall ? 'h-40' : 'h-32',
      )}
    >
      <div
        className="absolute bottom-0 left-0 right-0 transition-[height] duration-75"
        style={{ height: `${pct}%`, backgroundColor: clip ? 'var(--color-danger)' : color }}
      />
    </div>
  )
}

/** A tiny SVG of the summed 3-band EQ curve, drawn with the pure biquadResponse
 * approximation (no audio). Purely a visual aid. */
function EqCurve({ eq }: { eq: EqState }) {
  const W = 108
  const H = 34
  const path = useMemo(() => {
    const fMin = 30
    const fMax = 16000
    const n = 48
    const pts: string[] = []
    for (let i = 0; i <= n; i++) {
      const f = fMin * Math.pow(fMax / fMin, i / n)
      const db =
        biquadResponse('lowshelf', BANDS[0].freq, eq.low, BANDS[0].q, f) +
        biquadResponse('peaking', BANDS[1].freq, eq.mid, BANDS[1].q, f) +
        biquadResponse('highshelf', BANDS[2].freq, eq.high, BANDS[2].q, f)
      const x = (i / n) * W
      // Map ±(EQ_RANGE*1.5) dB across the height; 0 dB = middle.
      const y = H / 2 - (db / (EQ_RANGE * 1.5)) * (H / 2)
      pts.push(`${x.toFixed(1)},${Math.max(1, Math.min(H - 1, y)).toFixed(1)}`)
    }
    return pts.join(' ')
  }, [eq])

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="rounded-md bg-[var(--color-black-key)]"
      aria-hidden
    >
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="var(--color-border)" strokeWidth={1} />
      <polyline
        points={path}
        fill="none"
        stroke="var(--fag)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Audio graph construction + scheduling ─────────────────────────────────────

async function loadDrums(ctx: AudioContext): Promise<Record<number, AudioBuffer>> {
  const pitches = [36, 38, 42]
  const entries = await Promise.all(
    pitches.map(async (p) => {
      const res = await fetch(`/samples/drums/${p}.flac`)
      const arr = await res.arrayBuffer()
      const buf = await ctx.decodeAudioData(arr)
      return [p, buf] as const
    }),
  )
  return Object.fromEntries(entries)
}

function buildGraph(
  ctx: AudioContext,
  drumBuffers: Record<number, AudioBuffer>,
  channels: ChannelState[],
  master: number,
  monMaster: number,
  listen: 'sal' | 'monitor',
): Graph {
  const root = ctx.createGain()
  root.gain.value = 1
  root.connect(ctx.destination)

  // Buses + masters + listen gates.
  const fohBus = ctx.createGain()
  const monBus = ctx.createGain()
  const fohMaster = ctx.createGain()
  fohMaster.gain.value = dbToGain(master)
  const monMasterNode = ctx.createGain()
  monMasterNode.gain.value = dbToGain(monMaster)
  const fohListen = ctx.createGain()
  fohListen.gain.value = listen === 'sal' ? 1 : 0
  const monListen = ctx.createGain()
  monListen.gain.value = listen === 'monitor' ? 1 : 0
  const masterMeter = ctx.createAnalyser()
  masterMeter.fftSize = 1024

  fohBus.connect(fohMaster)
  fohMaster.connect(masterMeter) // meter/clip watch the mains sum
  fohMaster.connect(fohListen)
  fohListen.connect(root)
  monBus.connect(monMasterNode)
  monMasterNode.connect(monListen)
  monListen.connect(root)

  const channelNodes: ChannelNodes[] = channels.map((st, i) => {
    const cfg = CHANNELS[i]
    const low = ctx.createBiquadFilter()
    low.type = 'lowshelf'
    low.frequency.value = BANDS[0].freq
    low.gain.value = st.eq.low
    const mid = ctx.createBiquadFilter()
    mid.type = 'peaking'
    mid.frequency.value = BANDS[1].freq
    mid.Q.value = BANDS[1].q
    mid.gain.value = st.eq.mid
    const high = ctx.createBiquadFilter()
    high.type = 'highshelf'
    high.frequency.value = BANDS[2].freq
    high.gain.value = st.eq.high

    low.connect(mid)
    mid.connect(high)

    // Bass gets a pre-EQ lowpass so the square wave stays warm.
    let input: AudioNode = low
    if (cfg.id === 'bass') {
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 500
      lp.Q.value = 0.7
      lp.connect(low)
      input = lp
    }

    const fader = ctx.createGain()
    fader.gain.value = dbToGain(st.faderDb)
    const meter = ctx.createAnalyser()
    meter.fftSize = 512
    const monSend = ctx.createGain()
    monSend.gain.value = dbToGain(st.monSendDb)

    high.connect(fader)
    fader.connect(meter)
    fader.connect(fohBus)
    high.connect(monSend)
    monSend.connect(monBus)

    return { input, low, mid, high, fader, monSend, meter }
  })

  return {
    ctx,
    root,
    channels: channelNodes,
    fohMaster,
    monMaster: monMasterNode,
    fohListen,
    monListen,
    masterMeter,
    drumBuffers,
    activeSources: new Set(),
    scheduleTimer: 0,
    raf: 0,
    nextBarTime: ctx.currentTime + 0.15,
  }
}

function startScheduler(graph: Graph) {
  const { ctx } = graph
  const lookahead = 0.2
  graph.scheduleTimer = window.setInterval(() => {
    while (graph.nextBarTime < ctx.currentTime + lookahead) {
      scheduleBar(graph, graph.nextBarTime)
      graph.nextBarTime += BAR
    }
  }, 25)
}

function scheduleBar(graph: Graph, t0: number) {
  const { ctx } = graph
  const drumCh = graph.channels[0]
  const bassCh = graph.channels[1]
  const vocalCh = graph.channels[2]

  for (const hit of DRUM_HITS) {
    const buf = graph.drumBuffers[hit.pitch]
    if (!buf) continue
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = hit.gain
    src.connect(g)
    g.connect(drumCh.input)
    trackSource(graph, src)
    src.start(t0 + hit.beat * SPB)
  }

  for (const n of BASS_NOTES) {
    pluck(graph, bassCh.input, 'square', n.freq, t0 + n.beat * SPB, SPB * 0.9, 0.5)
  }
  for (const n of VOCAL_NOTES) {
    pluck(graph, vocalCh.input, 'sine', n.freq, t0 + n.beat * SPB, SPB * 0.95, 0.5)
  }
}

/** Schedule one enveloped oscillator note into `dest`. */
function pluck(
  graph: Graph,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  t: number,
  dur: number,
  peak: number,
) {
  const { ctx } = graph
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + 0.01)
  g.gain.setTargetAtTime(0, t + 0.02, dur / 3)
  osc.connect(g)
  g.connect(dest)
  trackSource(graph, osc)
  osc.start(t)
  osc.stop(t + dur + 0.15)
}

function trackSource(graph: Graph, src: AudioScheduledSourceNode) {
  graph.activeSources.add(src)
  src.addEventListener('ended', () => {
    graph.activeSources.delete(src)
    try {
      src.disconnect()
    } catch {
      /* already gone */
    }
  })
}

function startMeters(
  graph: Graph,
  clipUntilRef: React.MutableRefObject<number>,
  setMeters: (m: { ch: number[]; master: number; clip: boolean }) => void,
) {
  const chBufs = graph.channels.map((c) => new Float32Array(c.meter.fftSize))
  const mBuf = new Float32Array(graph.masterMeter.fftSize)
  const chSmooth = graph.channels.map(() => 0)
  let mSmooth = 0
  let last = 0

  const frame = (ts: number) => {
    graph.raf = requestAnimationFrame(frame)
    if (ts - last < 33) return // ~30 fps is plenty for meters
    last = ts

    const ch = graph.channels.map((c, i) => {
      c.meter.getFloatTimeDomainData(chBufs[i])
      const peak = peakOf(chBufs[i])
      // Fast attack, slow release for a readable meter.
      chSmooth[i] = peak > chSmooth[i] ? peak : chSmooth[i] * 0.85 + peak * 0.15
      return chSmooth[i]
    })

    graph.masterMeter.getFloatTimeDomainData(mBuf)
    const mPeak = peakOf(mBuf)
    mSmooth = mPeak > mSmooth ? mPeak : mSmooth * 0.85 + mPeak * 0.15
    if (mPeak > 0.99) clipUntilRef.current = ts + 1400 // hold the clip lamp
    const clip = ts < clipUntilRef.current

    setMeters({ ch, master: mSmooth, clip })
  }
  graph.raf = requestAnimationFrame(frame)
}

function peakOf(buf: Float32Array): number {
  let peak = 0
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i])
    if (a > peak) peak = a
  }
  return peak
}

function teardown(graph: Graph | null) {
  if (!graph) return
  if (graph.scheduleTimer) window.clearInterval(graph.scheduleTimer)
  if (graph.raf) cancelAnimationFrame(graph.raf)
  for (const src of graph.activeSources) {
    try {
      src.stop()
    } catch {
      /* already stopped */
    }
    try {
      src.disconnect()
    } catch {
      /* ignore */
    }
  }
  graph.activeSources.clear()
  // Disconnect our subgraph from the SHARED context's destination. Never close
  // the context — it belongs to the whole app.
  try {
    graph.root.disconnect()
  } catch {
    /* ignore */
  }
}
