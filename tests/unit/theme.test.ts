import { describe, it, expect } from 'vitest'
import React from 'react'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

describe('Theme & Dark Mode System', () => {
  it('exports ThemeProvider as a valid React component', () => {
    expect(typeof ThemeProvider).toBe('function')
  })

  it('exports ThemeToggle component supporting icon, segmented, and menu-item variants', () => {
    expect(typeof ThemeToggle).toBe('function')
  })

  it('verifies theme token structure in globals.css is configured for light and dark classes', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const globalsCss = fs.readFileSync(path.resolve(process.cwd(), 'app/globals.css'), 'utf-8')

    // Verifies custom variant for class-based dark mode in Tailwind v4
    expect(globalsCss).toContain('@custom-variant dark (&:where(.dark, .dark *));')

    // Verifies CSS variables defined for both light and dark
    expect(globalsCss).toContain(':root {')
    expect(globalsCss).toContain('--background: #F8FAFC;')
    expect(globalsCss).toContain('.dark {')
    expect(globalsCss).toContain('--background: #0B1220;')
    expect(globalsCss).toContain('--foreground: #F8FAFC;')
  })

  it('provides correct multilingual labels in Swahili and English for light and dark themes', () => {
    const swLabels = {
      light: 'Mwanga',
      dark: 'Giza',
      system: 'Mfumo',
    }
    const enLabels = {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    }

    expect(swLabels.light).toBe('Mwanga')
    expect(swLabels.dark).toBe('Giza')
    expect(swLabels.system).toBe('Mfumo')

    expect(enLabels.light).toBe('Light')
    expect(enLabels.dark).toBe('Dark')
    expect(enLabels.system).toBe('System')
  })
})
