import type { Level } from './exercises'

// The progress key for one bladspill level (best reading speed in noter/min —
// see lib/progress). It lives here, on its own, because BOTH the trainer and the
// level menu need it: the menu shows the personal best next to each level, and
// the trainer writes it. Reading it from the trainer's module would have pulled
// the whole reading session — NotationSong, VexFlow, the engine, Tone — into the
// page the moment it wanted a string.
export const progressKeyFor = (level: Level) => `bladspill:nivaa-${level}`
