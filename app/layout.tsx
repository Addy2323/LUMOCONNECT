import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'LUMO — Discover. Connect. Perform. Earn.',
  description: 'The deals and opportunities marketplace for verified partners.',
  generator: 'LUMO by LotusRise',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f8f6',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw" suppressHydrationWarning className="bg-background">
      <body suppressHydrationWarning className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
