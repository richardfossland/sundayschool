// ── Lydteknikk — lesson registry ──────────────────────────────────────────────
// The four sound-tech lessons in teaching order. The overview page renders one
// card per entry (plus a separate "Åpne miksepulten"-card); the [leksjon] route
// uses the slugs + prev/next ordering. Lesson bodies (prose + the MikserSim)
// live in the [leksjon] page. Same shape as teori/lessons.ts on purpose.

export interface LessonMeta {
  slug: string
  title: string
  tagline: string
}

export const LESSONS: LessonMeta[] = [
  {
    slug: 'signalkjeden',
    title: 'Signalkjeden og gain',
    tagline: 'Fra mikrofon til høyttaler — og hvorfor lyden knekker når du gir for mye.',
  },
  {
    slug: 'eq',
    title: 'EQ — å forme lyden',
    tagline: 'Bass, mellomtone og topp: fjern det som plager før du skrur opp det fine.',
  },
  {
    slug: 'monitor-og-sal',
    title: 'Monitor og sal',
    tagline: 'To helt forskjellige mikser — og hvordan du unngår rundgang.',
  },
  {
    slug: 'lydsjekk',
    title: 'Lydsjekk på søndag',
    tagline: 'En rolig, fast rutine som gjør deg trygg før folk kommer inn.',
  },
]

export function lessonIndex(slug: string): number {
  return LESSONS.findIndex((l) => l.slug === slug)
}
