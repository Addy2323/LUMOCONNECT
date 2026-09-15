import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import '@/lib/domGuard'
import { ClientDomGuard } from '@/components/common/ClientDomGuard'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { LanguageProvider } from '@/lib/i18n'
import { PwaRoot } from '@/components/pwa/PwaRoot'

export const metadata: Metadata = {
  title: 'LUMO — Discover. Connect. Perform. Earn.',
  description: 'The deals and opportunities marketplace for verified partners.',
  generator: 'LUMO by LotusRise',
  applicationName: 'Lumo Dealers',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lumo Dealers',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  other: {
    google: 'notranslate',
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#FF6A00',
  userScalable: true,
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw" translate="no" suppressHydrationWarning className="notranslate bg-background">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body suppressHydrationWarning className="notranslate antialiased">
        <ClientDomGuard />
        <ThemeProvider>
          <LanguageProvider>
            <PwaRoot>
              {children}
            </PwaRoot>
          </LanguageProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

