'use client'

import { useEffect, useRef, useState } from 'react'
import { Plug } from 'lucide-react'
import type { SongDoc } from '@/types/song'
import type { Groove } from '@/lib/drums/types'
import { usePlayer } from '@/lib/store'
import { getEngine } from '@/lib/engine'
import { installAudioUnlock } from '@/lib/audio-unlock'
import { hitsToEngineEvents } from '@/lib/drums/drum-track'
import { LANES, laneOf } from '@/lib/drums/drum-lanes'
import { useDrumTrainer } from '@/lib/drums/use-drum-trainer'
import { recordPractice } from '@/lib/progress'
import { connectMidi, midiSupported, type MidiConnection } from '@/lib/midi'
import { DrumLanes } from './DrumLanes'
import { ScreenPads } from './ScreenPads'
import { TimingSummary } from './TimingSummary'
import { DrumTransport } from './DrumTransport'

// ── GroovePlayer — practise ONE groove ────────────────────────────────────────
// The groove loops on the transport (engine plays it as an extra 'drums' track
// over an empty piano score) while the trainer judges every strike — screen pad
// or e-drum — against the pattern. Tempo, metronome and count-in behave exactly
// like the song player. E-drums send GM pitches on MIDI channel 10, but
// connectMidi masks the channel nibble (status & 0xf0), so their note-ons arrive
// like any other device — verified against lib/midi.ts.

interface Props {
  groove: Groove
}

/** The engine needs a SongDoc for its main (piano) track; a groove has no piano
 * score, so we hand it an empty one spanning the groove's length. */
function grooveDoc(g: Groove): SongDoc {
  return {
    formatVersion: 1,
    timeSignature: g.timeSignature,
    beatsPerBar: g.beatsPerBar,
    pickupBeats: 0,
    totalBeats: g.lengthBeats,
    keySignature: 'C',
    sections: [{ id: 'g', kind: 'verse', label: g.label, startBeat: 0, endBeat: g.lengthBeats }],
    notes: [],
    chords: [],
  }
}

export function GroovePlayer({ groove }: Props) {
  const isPlaying = usePlayer((s) => s.isPlaying)
  const isLoading = usePlayer((s) => s.isLoading)
  const bpm = usePlayer((s) => s.bpm)
  const metronome = usePlayer((s) => s.metronome)
  const countIn = usePlayer((s) => s.countIn)

  const [midi, setMidi] = useState<MidiConnection | null>(null)
  const [midiError, setMidiError] = useState<string | null>(null)

  const progressKey = `trommer:groove:${groove.id}`
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm

  // Trainer: judge strikes against the pattern; record practice on each pass.
  const trainer = useDrumTrainer(groove.hits, {
    onPassComplete: () => recordPractice(progressKey, bpmRef.current),
  })

  // Reset the transport to this groove's defaults; count-in on by default (a
  // trainer needs a "klar–ferdig–gå").
  useEffect(() => {
    usePlayer.getState().set({
      bpm: groove.bpmDefault,
      loop: null,
      currentBeat: 0,
      countIn: true,
      activeSectionId: null,
      waitMode: false,
    })
  }, [groove.id, groove.bpmDefault])

  // Install the iOS audio unlock once; tear the engine down on leave.
  useEffect(() => {
    installAudioUnlock()
    return () => getEngine().dispose()
  }, [])

  // Build the looping pattern. Drums carry GM-pitch identity — never transposed.
  useEffect(() => {
    const engine = getEngine()
    engine.stop()
    engine.build(grooveDoc(groove), {
      hand: 'both',
      bpm: bpmRef.current,
      loop: true, // a groove always loops
      extraTracks: [{ instrument: 'drums', events: hitsToEngineEvents(groove.hits) }],
    })
    engine.setLoopRange(null, null)
  }, [groove])

  // Strike helper shared by pads and MIDI: sound the drum + judge the timing.
  const strikeLane = (laneIndex: number) => {
    const engine = getEngine()
    void engine.playNote(LANES[laneIndex].padPitch, 0.9, 0.3, 'drums')
    return trainer.strike(laneIndex)
  }
  const strikeRef = useRef(strikeLane)
  strikeRef.current = strikeLane

  useEffect(() => () => midi?.dispose(), [midi])

  const onConnectMidi = async () => {
    setMidiError(null)
    try {
      const conn = await connectMidi({
        // E-drum note-on: map the GM pitch (aliases included) to its lane.
        onNoteOn: (pitch) => {
          const lane = laneOf(pitch)
          if (lane !== null) strikeRef.current(lane)
        },
        onNoteOff: () => {},
      })
      if (!conn) setMidiError('MIDI støttes ikke her — bruk Chrome/Edge, eller spill på skjermpadene.')
      else setMidi(conn)
    } catch (e) {
      setMidiError(e instanceof Error ? e.message : 'Kunne ikke koble til el-trommesettet.')
    }
  }

  const onPlayToggle = () => {
    const engine = getEngine()
    if (usePlayer.getState().isPlaying) {
      engine.stop()
      recordPractice(progressKey, usePlayer.getState().bpm)
    } else {
      void engine.play()
    }
  }
  const onBpm = (v: number) => {
    usePlayer.getState().setBpm(v)
    getEngine().setTempo(v)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* MIDI status */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-muted)]">
          {midi ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--color-sea)]">
              <Plug className="h-4 w-4" /> {midi.deviceNames[0] ?? 'MIDI tilkoblet'}
            </span>
          ) : (
            'Spill på skjermpadene (tastene A–L) — eller koble til et el-trommesett'
          )}
        </span>
        {midiSupported() && !midi && (
          <button
            onClick={onConnectMidi}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-ivory)]"
          >
            <Plug className="h-4 w-4" /> Koble til el-trommer
          </button>
        )}
      </div>
      {midiError && <p className="text-xs text-[var(--color-danger)]">{midiError}</p>}

      {/* Falling lanes + pads share the container width so lanes align with pads. */}
      <div className="flex flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
        <DrumLanes hits={groove.hits} results={trainer.results} />
        <ScreenPads onPad={(lane) => strikeRef.current(lane)} />
      </div>

      <TimingSummary score={trainer.score} onReset={trainer.reset} />

      <DrumTransport
        isPlaying={isPlaying}
        isLoading={isLoading}
        onPlayToggle={onPlayToggle}
        bpm={bpm}
        onBpm={onBpm}
        loop={true}
        metronome={metronome}
        onMetronomeToggle={() => usePlayer.getState().toggleMetronome()}
        countIn={countIn}
        onCountInToggle={() => usePlayer.getState().toggleCountIn()}
      />

      <p className="text-sm text-[var(--color-muted)]">
        Trykk spill og treff de fallende markørene når de når linja — grønt er perfekt, gult er
        litt tidlig/sent, rødt er bom. Grooven looper til du stopper.
      </p>
    </div>
  )
}
