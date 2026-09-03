'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Languages, WifiOff } from 'lucide-react'
import { translateUiText, useLanguage } from '@/lib/i18n'

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
    <div data-no-auto-translate className="fixed bottom-20 right-3 z-[70] flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 sm:bottom-5 sm:right-5" role="group" aria-label="Language / Lugha">
      <Languages className="ml-1.5 h-3.5 w-3.5 text-[#FF6A00]" aria-hidden="true" />
      <button type="button" onClick={() => setLocale('sw')} aria-pressed={locale === 'sw'} className={`min-h-9 rounded-full px-2.5 text-[11px] font-extrabold transition-colors sm:px-3 ${locale === 'sw' ? 'bg-[#0B132B] text-white dark:bg-[#FF6A00]' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>Kiswahili</button>
      <span className="text-xs text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>
      <button type="button" onClick={() => setLocale('en')} aria-pressed={locale === 'en'} className={`min-h-9 rounded-full px-2.5 text-[11px] font-extrabold transition-colors sm:px-3 ${locale === 'en' ? 'bg-[#0B132B] text-white dark:bg-[#FF6A00]' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>English</button>
      <button type="button" onClick={toggleLowData} aria-pressed={lowData} title="Low data / Data kidogo" className={`min-h-9 rounded-full px-2.5 text-[11px] font-extrabold transition-colors ${lowData ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
        <WifiOff className="inline h-3.5 w-3.5 sm:mr-1" aria-hidden="true" />
        <span className="hidden sm:inline">Data kidogo</span>
      </button>
    </div>
  )
}
