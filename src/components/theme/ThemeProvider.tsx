'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
  resolvedTheme: 'light' | 'dark'
  themes: string[]
  systemTheme?: 'light' | 'dark'
  forcedTheme?: string
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  themes: ['light', 'dark', 'system'],
  systemTheme: 'light',
})

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext)
}

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  forcedTheme?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'lumo_theme',
  attribute = 'class',
  enableSystem = true,
  forcedTheme,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultTheme
    try {
      return localStorage.getItem(storageKey) || defaultTheme
    } catch {
      return defaultTheme
    }
  })

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  // Listen to storage changes across tabs
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setThemeState(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [storageKey])

  const activeTheme = forcedTheme || theme

  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (activeTheme === 'system') return systemTheme
    return activeTheme === 'dark' ? 'dark' : 'light'
  }, [activeTheme, systemTheme])

  // Apply to document element
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (attribute === 'class') {
      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }
    } else {
      root.setAttribute(attribute, resolvedTheme)
    }
  }, [resolvedTheme, attribute])

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(storageKey, newTheme)
    } catch {}
  }

  const value = useMemo(
    () => ({
      theme: activeTheme,
      setTheme,
      resolvedTheme,
      themes: ['light', 'dark', 'system'],
      systemTheme,
      forcedTheme,
    }),
    [activeTheme, resolvedTheme, systemTheme, forcedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
