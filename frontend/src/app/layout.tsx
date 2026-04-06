import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '700', '800'],
  variable: '--font-poppins-var',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SakaBof Catálogo',
    template: '%s | SakaBof Catálogo',
  },
  description: 'Catálogo pessoal de itens da casa organizados por cômodos e locais.',
  robots: {
    index: false,
    follow: false,
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#ec407a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body className="bg-barbie-bg-light font-poppins text-barbie-text antialiased">
        <div
          id="toast-root"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2"
        />
        {children}
      </body>
    </html>
  )
}
