import { formatMoney } from '@/lib/money'

export interface MilestoneTier {
  id: string
  name: string
  targetCount: number
  bonusAmountTZS: bigint
  bonusDisplay: string
  description: string
}

export const PLATFORM_MILESTONES: MilestoneTier[] = [
  {
    id: 'ms_10_sales',
    name: 'Rising Promoter',
    targetCount: 10,
    bonusAmountTZS: BigInt(10000000), // TZS 100,000.00
    bonusDisplay: 'TZS 100,000',
    description: 'Reach 10 verified sales or activations',
  },
  {
    id: 'ms_25_sales',
    name: 'Growth Partner',
    targetCount: 25,
    bonusAmountTZS: BigInt(30000000), // TZS 300,000.00
    bonusDisplay: 'TZS 300,000',
    description: 'Reach 25 verified sales or activations',
  },
  {
    id: 'ms_50_sales',
    name: 'Premier Performer',
    targetCount: 50,
    bonusAmountTZS: BigInt(75000000), // TZS 750,000.00
    bonusDisplay: 'TZS 750,000',
    description: 'Reach 50 verified sales or activations',
  },
  {
    id: 'ms_100_sales',
    name: 'Master Rainmaker',
    targetCount: 100,
    bonusAmountTZS: BigInt(200000000), // TZS 2,000,000.00
    bonusDisplay: 'TZS 2,000,000',
    description: 'Reach 100 verified sales or activations',
  },
]

export interface MilestoneProgress {
  currentCount: number
  nextMilestone: MilestoneTier | null
  percentage: number
  remainingCount: number
  unlockedMilestones: MilestoneTier[]
}

export function getPartnerMilestoneProgress(currentCount: number): MilestoneProgress {
  const unlocked = PLATFORM_MILESTONES.filter((m) => currentCount >= m.targetCount)
  const next = PLATFORM_MILESTONES.find((m) => currentCount < m.targetCount) || null

  let percentage = 100
  let remainingCount = 0

  if (next) {
    const prevTarget = unlocked.length > 0 ? unlocked[unlocked.length - 1].targetCount : 0
    const targetSpan = next.targetCount - prevTarget
    const currentProgressInTier = currentCount - prevTarget
    percentage = Math.min(100, Math.max(0, Math.round((currentProgressInTier / targetSpan) * 100)))
    remainingCount = next.targetCount - currentCount
  }

  return {
    currentCount,
    nextMilestone: next,
    percentage,
    remainingCount,
    unlockedMilestones: unlocked,
  }
}
