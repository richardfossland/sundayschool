// ── Teori — lesson registry ───────────────────────────────────────────────────
// The four theory lessons in teaching order. The overview page renders one card
// per entry; the [leksjon] route uses the slugs + prev/next ordering. Content
// (prose + demos) lives in the [leksjon] page.

export interface LessonMeta {
  slug: string
  title: string
  tagline: string
}

export const LESSONS: LessonMeta[] = [
  {
    slug: 'intervaller',
    title: 'Intervaller',
    tagline: 'Avstanden mellom to toner — byggesteinen i alt gehør og all harmoni.',
  },
  {
    slug: 'akkorder',
    title: 'Akkorder',
    tagline: 'Treklanger og firklanger: dur, moll, septim og de andre fargene.',
  },
  {
    slug: 'kvintsirkelen',
    title: 'Kvintsirkelen',
    tagline: 'Kartet over toneartene — nabotonearter, fortegn og relativ moll.',
  },
  {
    slug: 'tonearter',
    title: 'Tonearter og transponering',
    tagline: 'Hvorfor forsangeren bytter toneart — og hvordan du følger med.',
  },
]

export function lessonIndex(slug: string): number {
  return LESSONS.findIndex((l) => l.slug === slug)
}
