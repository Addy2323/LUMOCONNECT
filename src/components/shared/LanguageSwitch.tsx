'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Languages, WifiOff, X } from 'lucide-react'
import { translateUiText, useLanguage } from '@/lib/i18n'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

const originalText = new WeakMap<Text, string>()
const translatedAttributes = ['placeholder', 'aria-label', 'title'] as const

function localizeTree(root: HTMLElement, locale: 'sw' | 'en') {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode() as Text | null
  while (node) {
    const parent = node.parentElement
    if (parent && !parent.closest('[data-no-auto-translate]') && !['SCRIPT', 'STYLE'].includes(parent.tagName)) {
      const current = node.nodeValue ?? ''
      const remembered = originalText.get(node)
      const rememberedSw = remembered?.replace(remembered.trim(), translateUiText(remembered.trim(), 'sw'))
      if (remembered === undefined || (current !== remembered && current !== rememberedSw)) {
        originalText.set(node, current)
      }
      const source = originalText.get(node) ?? ''
      const trimmed = source.trim()
      const next = trimmed ? source.replace(trimmed, translateUiText(trimmed, locale)) : source
      if (node.nodeValue !== next) node.nodeValue = next
    }
    node = walker.nextNode() as Text | null
  }

  root.querySelectorAll<HTMLElement>('*').forEach((element) => {
    if (element.closest('[data-no-auto-translate]')) return
    translatedAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute)
      const sourceKey = `data-lumo-${attribute}-en`
      const remembered = element.getAttribute(sourceKey)
      const source = remembered && value !== remembered && value !== translateUiText(remembered, 'sw') ? value : (remembered ?? value)
      if (!source) return
      if (element.getAttribute(sourceKey) !== source) element.setAttribute(sourceKey, source)
      const next = translateUiText(source, locale)
      if (value !== next) element.setAttribute(attribute, next)
    })
  })
}

export function LanguageSwitch() {
  const { locale, setLocale } = useLanguage()
  const running = useRef(false)
  const [lowData, setLowData] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const saved = window.localStorage.getItem('lumo_low_data')
    const initial = saved === 'true' || (saved === null && Boolean(connection?.saveData))
    setLowData(initial)
    document.documentElement.classList.toggle('lumo-low-data', initial)
  }, [])

  const toggleLowData = () => setLowData((value) => {
    const next = !value
    document.documentElement.classList.toggle('lumo-low-data', next)
    window.localStorage.setItem('lumo_low_data', String(next))
    return next
  })

  useEffect(() => {
    const root = document.getElementById('lumo-localized-app')
    if (!root) return
    localizeTree(root, locale)
    const observer = new MutationObserver(() => {
      if (running.current) return
      running.current = true
      requestAnimationFrame(() => {
        localizeTree(root, locale)
        running.current = false
      })
    })
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [locale])

  return (
    <div data-no-auto-translate className="fixed bottom-[74px] md:bottom-4 right-3 md:right-4 z-[70] flex items-center gap-2">
      {!expanded ? (
        <>
          <ThemeToggle
            variant="icon"
            className="flex items-center justify-center p-2 rounded-full border border-slate-200/90 dark:border-slate-700/90 bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 transition-all"
          />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Change language / Badili lugha"
            title={locale === 'sw' ? 'Badili lugha / Hali ya Data' : 'Change Language / Data Mode'}
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200/90 dark:border-slate-700/90 bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md text-xs font-extrabold text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <Languages className="h-4 w-4 text-[#FF6A00] transition-transform group-hover:rotate-12" />
            <span className="uppercase tracking-wider font-mono text-[11px]">{locale === 'sw' ? 'SW' : 'EN'}</span>
            {lowData && <WifiOff className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
          </button>
        </>
      ) : (
        <div
          className="flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-slate-700/90 dark:bg-slate-900/95 animate-in fade-in zoom-in-95 duration-150"
          role="group"
          aria-label="Language & Theme settings"
        >
          <Languages className="ml-2 h-4 w-4 text-[#FF6A00] shrink-0" aria-hidden="true" />

          <button
            type="button"
            onClick={() => { setLocale('sw'); setExpanded(false); }}
            aria-pressed={locale === 'sw'}
            className={`min-h-8 rounded-full px-3 text-[11px] font-extrabold transition-all cursor-pointer ${
              locale === 'sw'
                ? 'bg-[#0B132B] text-white dark:bg-[#FF6A00] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            Kiswahili
          </button>

          <span className="text-xs text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>

          <button
            type="button"
            onClick={() => { setLocale('en'); setExpanded(false); }}
            aria-pressed={locale === 'en'}
            className={`min-h-8 rounded-full px-3 text-[11px] font-extrabold transition-all cursor-pointer ${
              locale === 'en'
                ? 'bg-[#0B132B] text-white dark:bg-[#FF6A00] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            English
          </button>

          <span className="text-xs text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>

          <ThemeToggle variant="icon" className="p-1 rounded-full" />

          <span className="text-xs text-slate-300 dark:text-slate-700" aria-hidden="true">|</span>

          <button
            type="button"
            onClick={toggleLowData}
            aria-pressed={lowData}
            title={locale === 'sw' ? 'Hali ya data kidogo' : 'Low data mode'}
            className={`min-h-8 rounded-full px-2.5 text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              lowData
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{locale === 'sw' ? 'Data kidogo' : 'Low Data'}</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="ml-1 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            aria-label="Close menu"
            title="Close / Funga"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
