'use client'

import { useState, useEffect, useCallback } from 'react'

export interface PlatformConfig {
  platformFeePercent: number
  withholdingTaxPercent: number
  minPayoutTZS: number
  maxDailyDisbursementTZS: number
  dualControlDisbursementThresholdTZS: number
  platformCurrency: string
}

export const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  platformFeePercent: 3,
  withholdingTaxPercent: 5,
  minPayoutTZS: 50000,
  maxDailyDisbursementTZS: 50000000,
  dualControlDisbursementThresholdTZS: 1000000,
  platformCurrency: 'TZS',
}

const CONFIG_STORAGE_KEY = 'lumo_platform_config'
const CONFIG_UPDATE_EVENT = 'lumo:platform-config-updated'

export function getPlatformConfig(): PlatformConfig {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_CONFIG
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.warn('Failed to read platform config', e)
  }
  return DEFAULT_PLATFORM_CONFIG
}

export function updatePlatformConfig(updates: Partial<PlatformConfig>): PlatformConfig {
  const current = getPlatformConfig()
  const merged = { ...current, ...updates }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged))
      window.dispatchEvent(new CustomEvent(CONFIG_UPDATE_EVENT, { detail: merged }))
    } catch (e) {
      console.warn('Failed to save platform config', e)
    }
  }
  return merged
}

export function usePlatformConfig(): [PlatformConfig, (updates: Partial<PlatformConfig>) => void] {
  const [config, setConfig] = useState<PlatformConfig>(() => getPlatformConfig())

  const syncConfig = useCallback(() => {
    setConfig(getPlatformConfig())
  }, [])

  useEffect(() => {
    syncConfig()
    const handleUpdate = () => syncConfig()
    window.addEventListener(CONFIG_UPDATE_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener(CONFIG_UPDATE_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [syncConfig])

  const setConfigState = useCallback((updates: Partial<PlatformConfig>) => {
    const updated = updatePlatformConfig(updates)
    setConfig(updated)
  }, [])

  return [config, setConfigState]
}
