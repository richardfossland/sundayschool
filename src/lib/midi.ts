// Web MIDI input (native, no dependency). Ported from SundayLicks and EXTENDED:
// in addition to note-on we report note-off ((status & 0xf0) === 0x80, plus
// note-on with velocity 0) and maintain a live "held set" of the currently
// pressed keys — besifringsmodus (fase 2) needs to know which notes are held
// down together to validate a chord.
// Chrome/Edge support requestMIDIAccess; Safari/Firefox/iOS do not — callers
// should feature-detect with `midiSupported()` and fall back to the on-screen
// keyboard.

export function midiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator
}

export interface MidiHandlers {
  /** A key was pressed. `velocity` is normalised 0–1. */
  onNoteOn: (pitch: number, velocity: number) => void
  /** A key was released (real note-off, or a note-on with velocity 0). */
  onNoteOff: (pitch: number) => void
}

export interface MidiConnection {
  deviceNames: string[]
  /** The MIDI note numbers currently held down, ascending. Besifringsmodus
   * reads this to detect chords built from simultaneously-held keys. */
  heldNotes: () => number[]
  dispose: () => void
}

interface MidiLike {
  inputs: Map<
    string,
    { name?: string | null; onmidimessage: ((e: { data: Uint8Array }) => void) | null }
  >
  onstatechange: (() => void) | null
}

/**
 * Request MIDI access and route note-on/note-off to `handlers`, while keeping an
 * internal held set exposed via `heldNotes()`. Resolves with the connected
 * device names and a disposer, or `null` when Web MIDI is unsupported or access
 * is denied (caller then falls back to the on-screen keyboard).
 */
export async function connectMidi(handlers: MidiHandlers): Promise<MidiConnection | null> {
  if (!midiSupported()) return null

  let access: MidiLike
  try {
    // @ts-expect-error requestMIDIAccess is not in the ambient TS lib here.
    access = (await navigator.requestMIDIAccess({ sysex: false })) as MidiLike
  } catch {
    return null // permission denied — fall back to the on-screen keyboard
  }

  // The single source of truth for what is pressed right now.
  const held = new Set<number>()

  const handle = (data: Uint8Array) => {
    const status = data[0]
    const note = data[1]
    const vel = data[2]
    const cmd = status & 0xf0
    // 0x90 = note-on; a note-on with velocity 0 is a note-off (running status).
    if (cmd === 0x90 && vel > 0) {
      held.add(note)
      handlers.onNoteOn(note, vel / 127)
    } else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) {
      held.delete(note)
      handlers.onNoteOff(note)
    }
  }

  const attach = () => {
    for (const input of access.inputs.values()) {
      input.onmidimessage = (e: { data: Uint8Array }) => handle(e.data)
    }
  }
  attach()
  access.onstatechange = attach

  const deviceNames: string[] = []
  for (const input of access.inputs.values()) deviceNames.push(input.name || 'MIDI-enhet')

  return {
    deviceNames,
    heldNotes: () => [...held].sort((a, b) => a - b),
    dispose: () => {
      for (const input of access.inputs.values()) input.onmidimessage = null
      access.onstatechange = null
      held.clear()
    },
  }
}
