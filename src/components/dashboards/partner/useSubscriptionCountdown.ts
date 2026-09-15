import { useState, useEffect, useMemo } from 'react'
import type { PartnerSubscriptionPlan } from './types'

export interface SubscriptionCountdownResult {
  remainingMs: number
  totalDurationMs: number
  progressPercent: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  isExpiringSoon: boolean
  displayTime: string
  badgeDisplay: string
}

export function useSubscriptionCountdown(
  subscription?: PartnerSubscriptionPlan
): SubscriptionCountdownResult {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const serverOffset = useMemo(() => {
    if (!subscription?.serverTimeISO) return 0
    const st = new Date(subscription.serverTimeISO).getTime()
    return isNaN(st) ? 0 : st - Date.now()
  }, [subscription?.serverTimeISO])

  const authoritativeNow = now + serverOffset

  const targetExpiryMs = useMemo(() => {
    if (subscription?.expiresAtISO) {
      const exp = new Date(subscription.expiresAtISO).getTime()
      if (!isNaN(exp) && exp > 0) return exp
    }
    if (subscription?.daysRemaining && subscription.daysRemaining > 0) {
      return Date.now() + subscription.daysRemaining * 86400000
    }
    return 0
  }, [subscription?.expiresAtISO, subscription?.daysRemaining])

  const defaultCycleDays = useMemo(() => {
    if (!subscription?.cycle) return 30
    if (subscription.cycle === 'SEMI_ANNUAL') return 180
    if (subscription.cycle === 'ANNUAL' || subscription.cycle === 'ENTERPRISE') return 365
    return 30
  }, [subscription?.cycle])

  const startMs = useMemo(() => {
    if (subscription?.startedAtISO) {
      const st = new Date(subscription.startedAtISO).getTime()
      if (!isNaN(st) && targetExpiryMs > st) return st
    }
    return targetExpiryMs > 0 ? targetExpiryMs - defaultCycleDays * 86400000 : 0
  }, [subscription?.startedAtISO, targetExpiryMs, defaultCycleDays])

  const remainingMs = Math.max(0, targetExpiryMs - authoritativeNow)
  const totalDurationMs = Math.max(1, targetExpiryMs - startMs)

  const rawProgressPercent =
    totalDurationMs > 0 ? (remainingMs / totalDurationMs) * 100 : 0
  const progressPercent = Math.max(0, Math.min(100, rawProgressPercent))

  const days = Math.floor(remainingMs / 86400000)
  const hours = Math.floor((remainingMs % 86400000) / 3600000)
  const minutes = Math.floor((remainingMs % 3600000) / 60000)
  const seconds = Math.floor((remainingMs % 60000) / 1000)

  const isExpired =
    !subscription ||
    subscription.status === 'EXPIRED' ||
    (targetExpiryMs > 0 && remainingMs === 0) ||
    subscription.status !== 'ACTIVE'

  const isExpiringSoon = !isExpired && remainingMs <= 24 * 60 * 60 * 1000 && remainingMs > 0

  let displayTime = ''
  if (isExpired) {
    displayTime = '0d 00h (Expired)'
  } else if (days > 0) {
    displayTime = `${days}d ${hours}h ${minutes}m ${seconds}s`
  } else {
    displayTime = `${hours}h ${minutes}m ${seconds}s`
  }

  let badgeDisplay = ''
  if (isExpired) {
    badgeDisplay = 'Expired'
  } else if (days > 0) {
    badgeDisplay = `${days}d ${hours}h left`
  } else {
    badgeDisplay = `${hours}h ${minutes}m left`
  }

  return {
    remainingMs,
    totalDurationMs,
    progressPercent,
    days,
    hours,
    minutes,
    seconds,
    isExpired,
    isExpiringSoon,
    displayTime,
    badgeDisplay,
  }
}
