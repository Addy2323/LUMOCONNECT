'use client'

import React from 'react'
import { PwaProvider } from '@/lib/pwa/PwaContext'
import { FirstVisitInstallPrompt } from './FirstVisitInstallPrompt'
import { PwaInstallInstructionsModal } from './PwaInstallInstructionsModal'
import { AppUpdateBanner } from './AppUpdateBanner'

export function PwaRoot({ children }: { children: React.ReactNode }) {
  return (
    <PwaProvider>
      {children}
      <FirstVisitInstallPrompt />
      <PwaInstallInstructionsModal />
      <AppUpdateBanner />
    </PwaProvider>
  )
}
