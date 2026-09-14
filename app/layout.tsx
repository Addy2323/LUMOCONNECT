import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import '@/lib/domGuard'
import { ClientDomGuard } from '@/components/common/ClientDomGuard'
import { LanguageProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'LUMO — Discover. Connect. Perform. Earn.',
  description: 'The deals and opportunities marketplace for verified partners.',
  generator: 'LUMO by LotusRise',
  other: {
    google: 'notranslate',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f8f6',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw" translate="no" suppressHydrationWarning className="notranslate bg-background">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body suppressHydrationWarning className="notranslate antialiased">
        <ClientDomGuard />
        <LanguageProvider>{children}</LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
