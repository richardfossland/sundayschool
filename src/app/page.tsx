// Placeholder forside — erstattes av W6 (sider + AppShell + tema).
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-4xl text-[var(--color-amber)]">SundaySchool</h1>
      <p className="text-[var(--color-muted)]">
        Lær salmer, lovsang og gospel på piano — fallende noter, ekte notasjon og transponering.
      </p>
    </main>
  )
}
