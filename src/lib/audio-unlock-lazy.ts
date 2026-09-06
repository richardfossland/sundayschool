// Install the iOS audio unlock WITHOUT putting Tone in the page's first load.
//
// audio-unlock.ts imports Tone (it calls Tone.start() and reaches for the raw
// AudioContext), so a plain `import { installAudioUnlock }` at the top of a
// subject page drags all of Tone into that route's bundle — which is exactly
// what the lazy trainers exist to avoid. Fetching it from the mount effect
// instead keeps the module out of the critical path while still installing it
// within a tick or two of hydration, i.e. long before anyone can click.
//
// The unlock listens for the FIRST gesture. In the vanishingly rare case that a
// click beats the chunk, nothing breaks: every play path also calls
// ensureAudioRunning(), and on these pages playback always starts from a
// gesture of its own.
export function installAudioUnlockSoon() {
  void import('./audio-unlock').then((m) => m.installAudioUnlock())
}
