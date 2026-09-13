import { NextResponse } from 'next/server'
import { getMesejiClient } from '@/lib/providers/meseji-client'
import { getSmsStoreSummary } from '@/modules/sms/store'

export async function GET() {
  try {
    const client = getMesejiClient()
    const config = client.getConfig()

    // 1. Fetch live user stats & sender IDs from Meseji (or mock if dry-run / error)
    const [userStatsResult, senderIdsResult] = await Promise.allSettled([
      client.getUserStats(),
      client.getSenderIds(),
    ])

    const userStats = userStatsResult.status === 'fulfilled' ? userStatsResult.value : null
    const senderIds = senderIdsResult.status === 'fulfilled' ? senderIdsResult.value.sender_ids : []

    // Verify whether configured sender ID is verified
    const isSenderIdApproved = senderIds.some(
      (s) => s.name.toUpperCase() === config.senderId.toUpperCase() && (s.status === 'APPROVED' || s.status === 'active')
    )

    // 2. Fetch local store aggregates
    const localStoreSummary = getSmsStoreSummary()

    return NextResponse.json({
      config: {
        isConfigured: config.isConfigured,
        dryRun: config.dryRun,
        enabled: config.enabled,
        senderId: config.senderId,
        isSenderIdApproved,
      },
      providerStats: userStats,
      senderIds,
      localStore: localStoreSummary,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve SMS statistics' },
      { status: 500 }
    )
  }
}
