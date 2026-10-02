import { z } from 'zod'

export const earningsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  minimumTZS: z.number().int().min(0).max(1000000000).default(0),
  maximumCards: z.number().int().min(1).max(30).default(20),
  mode: z.enum(['APPROVED', 'PAID']).default('PAID'),
  showCategory: z.boolean().default(true),
  showTime: z.boolean().default(true),
  maskDigits: z.number().int().min(3).max(4).default(4),
  secondsPerCard: z.number().int().min(4).max(20).default(5),
})

export type EarningsConfig = z.infer<typeof earningsConfigSchema>

export type PublicEarning = {
  id: string
  maskedIdentity: string
  amount: number
  currency: string
  category: string
  dealTitle?: string
  dealType: 'LOCAL' | 'INTERNATIONAL'
  status: string
  earnedAt: string
  showInFeed?: boolean
}

export function maskEarner(identity: string | null | undefined, digits: number = 4): string {
  if (!identity || !identity.trim()) return 'A****8'
  const clean = identity.trim().replace(/^\+/, '')
  const phoneDigits = clean.replace(/\D/g, '')
  if (phoneDigits.length >= 7) {
    const firstChar = 'A'
    const lastChar = phoneDigits.slice(-1)
    return `${firstChar}****${lastChar}`
  }
  const parts = clean.split(' ')
  if (parts.length >= 2) {
    const firstLetter = parts[0][0]?.toUpperCase() || 'A'
    const lastLetter = parts[parts.length - 1][0]?.toUpperCase() || '8'
    return `${firstLetter}****${lastLetter}`
  }
  const firstLetter = clean[0]?.toUpperCase() || 'A'
  const lastChar = clean[clean.length - 1]?.toUpperCase() || '8'
  return `${firstLetter}****${lastChar}`
}

export function earningsTimeAgo(date: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - new Date(date).getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`
  return `${Math.floor(minutes / 1440)} days ago`
}
