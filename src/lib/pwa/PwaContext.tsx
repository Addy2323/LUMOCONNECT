'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type PwaPlatform = 'ios' | 'android' | 'desktop' | 'unknown'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PwaContextValue {
  isInstallable: boolean
  isInstalled: boolean
  isDismissed: boolean
  platform: PwaPlatform
  showFirstVisitPrompt: boolean
  showInstructionsModal: boolean
  isUpdateAvailable: boolean
  openInstallFlow: () => void
  closeInstructionsModal: () => void
  dismissFirstVisitPrompt: () => void
  applyUpdate: () => void
}

const PwaContext = createContext<PwaContextValue | null>(null)

const DISMISSED_STORAGE_KEY = 'lumo_pwa_dismissed'

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(true) // default true until mounted
  const [showFirstVisitPrompt, setShowFirstVisitPrompt] = useState(false)
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [platform, setPlatform] = useState<PwaPlatform>('unknown')

  // Check standalone mode (installed app)
  const checkIsInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches
    const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
    const isSourcePwa = window.location.search.includes('source=pwa')
    return Boolean(isStandaloneDisplay || isIosStandalone || isSourcePwa)
  }, [])

  // Detect platform
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ua = navigator.userAgent || ''
    if (/iphone|ipad|ipod/i.test(ua)) {
      setPlatform('ios')
    } else if (/android/i.test(ua)) {
      setPlatform('android')
    } else {
      setPlatform('desktop')
    }

    const currentlyInstalled = checkIsInstalled()
    setIsInstalled(currentlyInstalled)

    // Check dismissal status in localStorage
    const dismissedVal = localStorage.getItem(DISMISSED_STORAGE_KEY) === 'true'
    setIsDismissed(dismissedVal)

    // Show first-visit prompt if not installed and not dismissed
    if (!currentlyInstalled && !dismissedVal) {
      const timer = setTimeout(() => {
        setShowFirstVisitPrompt(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [checkIsInstalled])

  // Listen for beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      // Browser evidence of genuine installation
      setIsInstalled(true)
      setDeferredPrompt(null)
      setIsInstallable(false)
      setShowFirstVisitPrompt(false)
      setShowInstructionsModal(false)
      localStorage.setItem(DISMISSED_STORAGE_KEY, 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Listen for display-mode change
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true)
        setShowFirstVisitPrompt(false)
      }
    }
    mediaQuery.addEventListener?.('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      mediaQuery.removeEventListener?.('change', handleDisplayModeChange)
    }
  }, [])

  // Service Worker Registration and Update Detection
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // If a waiting worker already exists
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setIsUpdateAvailable(true)
        }

        // Listen for new worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update available, waiting to activate
              setWaitingWorker(newWorker)
              setIsUpdateAvailable(true)
            }
          })
        })
      })
      .catch((err) => {
        console.warn('[LUMO PWA] Service worker registration error:', err)
      })

    // Listen for controlling service worker change
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  // Open Install Flow: uses native prompt if available, or shows platform instructions
  const openInstallFlow = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null)
          setIsInstallable(false)
          setShowFirstVisitPrompt(false)
        }
      } catch (err) {
        console.warn('[LUMO PWA] Install prompt error:', err)
        setShowInstructionsModal(true)
      }
    } else {
      // Native prompt unavailable -> Show platform-appropriate instructions
      setShowInstructionsModal(true)
    }
  }, [deferredPrompt])

  const closeInstructionsModal = useCallback(() => {
    setShowInstructionsModal(false)
  }, [])

  // Dismiss first-visit prompt and remember in localStorage
  const dismissFirstVisitPrompt = useCallback(() => {
    setShowFirstVisitPrompt(false)
    setIsDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISSED_STORAGE_KEY, 'true')
    }
  }, [])

  // Apply update without forcing reload while user is interacting
  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      setIsUpdateAvailable(false)
    } else {
      window.location.reload()
    }
  }, [waitingWorker])

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isDismissed,
        platform,
        showFirstVisitPrompt,
        showInstructionsModal,
        isUpdateAvailable,
        openInstallFlow,
        closeInstructionsModal,
        dismissFirstVisitPrompt,
        applyUpdate,
      }}
    >
      {children}
    </PwaContext.Provider>
  )
}

export function usePwa() {
  const context = useContext(PwaContext)
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider')
  }
  return context
}
