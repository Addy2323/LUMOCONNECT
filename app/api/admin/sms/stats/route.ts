import { NextResponse } from 'next/server'
import { getActiveSmsProviderName } from '@/lib/providers'
import { getBeemClient } from '@/lib/providers/beem-client'
import { getMesejiClient } from '@/lib/providers/meseji-client'
import { getSmsStoreSummary, getSmsJobsNeedingReview } from '@/modules/sms/store'

export async function GET() {
  try {
    const activeProvider = getActiveSmsProviderName()

    if (activeProvider === 'beem') {
      const client = getBeemClient()
      const config = client.getConfig()

      const [balanceResult, senderNamesResult] = await Promise.allSettled([
        client.getVendorBalance(),
        client.listSenderNames(),
      ])

      const balance = balanceResult.status === 'fulfilled' && balanceResult.value.success
        ? balanceResult.value
        : { credit_balance: 0, currency: 'TZS' }

      const senderNames = senderNamesResult.status === 'fulfilled' && senderNamesResult.value.success
        ? senderNamesResult.value.sender_names
        : []

      const isSenderIdApproved = senderNames.some(
        (s) => s.senderid.toUpperCase() === config.senderId.toUpperCase() && (s.status === 'APPROVED' || s.status === 'ACTIVE')
      )

      const localStoreSummary = getSmsStoreSummary()
      const needingReview = getSmsJobsNeedingReview()

      return NextResponse.json({
        config: {
          provider: 'beem',
          applicationId: client.applicationId,
          applicationName: client.applicationName,
          senderId: config.senderId,
          isConfigured: config.isConfigured,
          dryRun: config.dryRun,
          enabled: config.enabled,
          isSenderIdApproved,
        },
        providerStats: {
          balance: balance.credit_balance,
          currency: balance.currency,
        },
        senderIds: senderNames.map((s) => ({
          id: s.id,
          name: s.senderid,
          status: s.status,
          sampleMessage: s.sample_content,
          createdAt: s.created,
        })),
        localStore: {
          ...localStoreSummary,
          needingReviewCount: needingReview.length,
        },
      })
    }

    // Legacy Meseji fallback
    const client = getMesejiClient()
    const config = client.getConfig()

    const [userStatsResult, senderIdsResult] = await Promise.allSettled([
      client.getUserStats(),
      client.getSenderIds(),
    ])

    const userStats = userStatsResult.status === 'fulfilled' ? userStatsResult.value : null
    const senderIds = senderIdsResult.status === 'fulfilled' ? senderIdsResult.value.sender_ids : []

    const isSenderIdApproved = senderIds.some(
      (s) => s.name.toUpperCase() === config.senderId.toUpperCase() && (s.status === 'APPROVED' || s.status === 'active')
    )

    const localStoreSummary = getSmsStoreSummary()

    return NextResponse.json({
      config: {
        provider: 'meseji',
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
