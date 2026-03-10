import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

// ✅ display: 'swap' adicionado — evita texto invisível (FOIT) em mobile/3G
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})


export const metadata: Metadata = {
  title: 'MeAndYou — Relacionamentos com pessoas verificadas',
  description: 'O app de relacionamentos com verificação real de identidade e os filtros mais completos do Brasil.',
  openGraph: {
    title: 'MeAndYou',
    description: 'Relacionamentos reais com pessoas verificadas',
    url: 'https://www.meandyou.com.br',
    siteName: 'MeAndYou',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: 'https://www.meandyou.com.br/logo.png',
        width: 1200,
        height: 630,
        alt: 'MeAndYou — Relacionamentos com pessoas verificadas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeAndYou',
    description: 'Relacionamentos reais com pessoas verificadas',
    images: ['https://www.meandyou.com.br/logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${plusJakarta.variable}`}>
        {children}
      </body>
    </html>
  )
}
