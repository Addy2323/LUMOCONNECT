import { z } from 'zod'

export const earningsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  minimumTZS: z.number().int().min(0).max(1000000000).default(0),
  maximumCards: z.number().int().min(1).max(30).default(20),
  mode: z.enum(['APPROVED', 'PAID']).default('APPROVED'),
  showCategory: z.boolean().default(true),
  showTime: z.boolean().default(true),
  maskDigits: z.number().int().min(3).max(4).default(4),
  secondsPerCard: z.number().int().min(4).max(20).default(5),
})
export type EarningsConfig = z.infer<typeof earningsConfigSchema>
export type PublicEarning = { id: string; maskedIdentity: string; amount: number; currency: string; category: string; earnedAt: string }
export function maskEarner(phone: string | null, digits: number) {
  const normalized = phone?.replace(/\D/g, '')
  return normalized && normalized.length >= 9 ? `Partner ${'*'.repeat(8)}${normalized.slice(-digits)}` : 'Partner'
}
export function earningsTimeAgo(date: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - new Date(date).getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`
  return `${Math.floor(minutes / 1440)} days ago`
}
