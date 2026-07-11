import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Playfair_Display } from 'next/font/google'
import './globals.css'

const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'SundaySchool — musikkskolen og søndagsskolen for menigheten',
  description:
    'Lær piano, gitar, bass og trommer med fallende noter, ekte notasjon, vent-modus og transponering — og gå dypere i troen med teologi, teori og gehørtrening. Salmer, hymner, gospel og spirituals; fritt og lovlig repertoar.',
}

export const viewport: Viewport = {
  themeColor: '#171210',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${hanken.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-[var(--color-scene)] font-sans text-[var(--color-ivory)] antialiased">
        {children}
      </body>
    </html>
  )
}
