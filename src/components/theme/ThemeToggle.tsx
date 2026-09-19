'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'menu-item'
  className?: string
  showLabel?: boolean
  onSelect?: () => void
}

export function ThemeToggle({
  variant = 'icon',
  className = '',
  showLabel = false,
  onSelect,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { locale } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? (theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark')) : false

  // Labels
  const labels = {
    light: locale === 'sw' ? 'Mwanga' : 'Light',
    dark: locale === 'sw' ? 'Giza' : 'Dark',
    system: locale === 'sw' ? 'Mfumo' : 'System',
    toggle: locale === 'sw' ? 'Badili mandhari (Mwanga / Giza)' : 'Toggle theme (Light / Dark)',
  }

  const handleToggleLightDark = () => {
    if (!mounted) return
    const nextTheme = isDark ? 'light' : 'dark'
    setTheme(nextTheme)
    onSelect?.()
  }

  // Segmented 3-option control (Light | Dark | System)
  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold ${className}`}
        role="group"
        aria-label="Theme selection"
      >
        <button
          type="button"
          onClick={() => {
            setTheme('light')
            onSelect?.()
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            mounted && theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-[#FF6A00] font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
          title={labels.light}
          aria-pressed={mounted && theme === 'light'}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>{labels.light}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTheme('dark')
            onSelect?.()
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            mounted && theme === 'dark'
              ? 'bg-white dark:bg-slate-700 text-[#FF6A00] font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
          title={labels.dark}
          aria-pressed={mounted && theme === 'dark'}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>{labels.dark}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTheme('system')
            onSelect?.()
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            mounted && theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-[#FF6A00] font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
          title={labels.system}
          aria-pressed={mounted && theme === 'system'}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>{labels.system}</span>
        </button>
      </div>
    )
  }

  // Menu item row (for dropdowns / settings menus)
  if (variant === 'menu-item') {
    return (
      <div className={`flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          {isDark ? (
            <Moon className="w-4 h-4 text-[#FF6A00]" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
          <span>{locale === 'sw' ? 'Mandhari' : 'Theme'}</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setTheme('light')
              onSelect?.()
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              mounted && theme === 'light'
                ? 'bg-white dark:bg-slate-700 text-[#FF6A00] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title={labels.light}
            aria-label={labels.light}
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('dark')
              onSelect?.()
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              mounted && theme === 'dark'
                ? 'bg-white dark:bg-slate-700 text-[#FF6A00] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title={labels.dark}
            aria-label={labels.dark}
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setTheme('system')
              onSelect?.()
            }}
            className={`p-1.5 rounded-md transition-all cursor-pointer ${
              mounted && theme === 'system'
                ? 'bg-white dark:bg-slate-700 text-[#FF6A00] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
            title={labels.system}
            aria-label={labels.system}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Default: Compact Icon button toggle with micro-interaction
  return (
    <button
      type="button"
      onClick={handleToggleLightDark}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer ${className}`}
      aria-label={labels.toggle}
      title={mounted ? (isDark ? `${labels.light}` : `${labels.dark}`) : labels.toggle}
    >
      <span className="sr-only">{labels.toggle}</span>
      {mounted ? (
        isDark ? (
          <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-200" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300 hover:-rotate-12 transition-transform duration-200" />
        )
      ) : (
        <span className="w-4 h-4 block rounded-full border border-current opacity-40 animate-pulse" />
      )}
      {showLabel && mounted && (
        <span className="ml-2 text-xs font-semibold">
          {isDark ? labels.light : labels.dark}
        </span>
      )}
    </button>
  )
}
