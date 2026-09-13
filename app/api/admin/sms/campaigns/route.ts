import { NextRequest, NextResponse } from 'next/server'
import {
  listSmsCampaigns,
  createSmsCampaign,
  updateCampaignStatus,
  recordSmsJob,
  updateSmsJobStatus,
  addSmsAuditLog,
} from '@/modules/sms/store'
import { normalizeTanzaniaPhone, isValidTanzaniaPhone, detectTanzaniaOperator } from '@/modules/sms/phone'
import { calculateSmsSegments } from '@/modules/sms/templates'
import { getMesejiClient } from '@/lib/providers/meseji-client'

export async function GET() {
  try {
    const campaigns = listSmsCampaigns()
    return NextResponse.json({ campaigns })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      action = 'DISPATCH',
      campaignId,
      name,
      messageText,
      recipients = [],
      senderId = 'Lumo',
      audienceConsentConfirmed = false,
      scheduledAt,
    } = body

    // 1. Campaign state actions (PAUSE / RESUME / CANCEL)
    if (action === 'PAUSE' || action === 'RESUME' || action === 'CANCEL') {
      if (!campaignId) {
        return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
      }
      const newStatus = action === 'PAUSE' ? 'PAUSED' : action === 'RESUME' ? 'ACTIVE' : 'CANCELLED'
      const updated = updateCampaignStatus(campaignId, newStatus)
      addSmsAuditLog(`CAMPAIGN_${action}`, 'admin_console', { campaignId }, campaignId)
      return NextResponse.json({ success: true, campaign: updated })
    }

    // 2. Pre-flight Campaign Estimation
    if (action === 'ESTIMATE') {
      if (!messageText) {
        return NextResponse.json({ error: 'messageText is required for estimation' }, { status: 400 })
      }

      const rawRecipients = Array.isArray(recipients) ? recipients : []
      const validNumbers = new Set<string>()
      const invalidNumbers: string[] = []

      for (const raw of rawRecipients) {
        const clean = String(raw).trim()
        if (isValidTanzaniaPhone(clean)) {
          validNumbers.add(normalizeTanzaniaPhone(clean))
        } else {
          invalidNumbers.push(clean)
        }
      }

      const segmentMetrics = calculateSmsSegments(messageText)
      const recipientCount = validNumbers.size
      const totalSegments = recipientCount * segmentMetrics.segmentCount
      // Standard Tanzania SMS tariff ~ TZS 25-30 per segment
      const estimatedCostTzs = totalSegments * 25

      return NextResponse.json({
        totalSubmitted: rawRecipients.length,
        uniqueValidRecipients: recipientCount,
        invalidRecipientsCount: invalidNumbers.length,
        characterCount: segmentMetrics.characterCount,
        isGsm7: segmentMetrics.isGsm7,
        segmentsPerMessage: segmentMetrics.segmentCount,
        totalBillableSegments: totalSegments,
        estimatedCostTzs,
      })
    }

    // 3. Dispatch Bulk Campaign
    if (action === 'DISPATCH') {
      if (!name || !messageText) {
        return NextResponse.json({ error: 'name and messageText are required' }, { status: 400 })
      }

      if (!audienceConsentConfirmed) {
        return NextResponse.json(
          { error: 'Explicit audience opt-in consent confirmation is required before broadcasting SMS campaigns.' },
          { status: 400 }
        )
      }

      const rawRecipients = Array.isArray(recipients) ? recipients : []
      const uniqueNormalized = Array.from(
        new Set(
          rawRecipients
            .map((r: any) => String(r).trim())
            .filter((r: string) => isValidTanzaniaPhone(r))
            .map((r: string) => normalizeTanzaniaPhone(r))
        )
      )

      if (uniqueNormalized.length === 0) {
        return NextResponse.json({ error: 'No valid Tanzanian phone numbers provided.' }, { status: 400 })
      }

      const segmentMetrics = calculateSmsSegments(messageText)
      const totalSegments = uniqueNormalized.length * segmentMetrics.segmentCount

      // Create Campaign in Store
      const campaign = createSmsCampaign({
        name,
        senderId,
        messageText,
        totalRecipients: uniqueNormalized.length,
        totalSegments,
        costEstimateTzs: totalSegments * 25,
        audienceFilter: { consentConfirmed: true },
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      })

      // Dispatch via Meseji Client
      const client = getMesejiClient()
      const sendResult = await client.sendBulkSms({
        recipientPhones: uniqueNormalized,
        messageText,
        senderId,
      })

      // Record SMS jobs in local store
      for (const phone of uniqueNormalized) {
        const operator = detectTanzaniaOperator(phone)
        const job = recordSmsJob({
          recipientPhone: phone,
          messageText,
          senderId,
          channel: 'MARKETING',
          operator,
          campaignId: campaign.id,
          segments: segmentMetrics.segmentCount,
          characterCount: segmentMetrics.characterCount,
          isGsm7: segmentMetrics.isGsm7,
          batchId: sendResult.batchId,
        })

        updateSmsJobStatus(
          job.id,
          sendResult.success ? 'SUBMITTED' : 'FAILED',
          sendResult.batchId,
          sendResult.error
        )
      }

      updateCampaignStatus(campaign.id, sendResult.success ? 'COMPLETED' : 'FAILED')
      addSmsAuditLog(
        'CAMPAIGN_DISPATCHED',
        'admin_console',
        {
          campaignId: campaign.id,
          recipientsCount: uniqueNormalized.length,
          batchId: sendResult.batchId,
          success: sendResult.success,
        },
        campaign.id
      )

      return NextResponse.json({
        success: sendResult.success,
        campaignId: campaign.id,
        batchId: sendResult.batchId,
        recipientsCount: uniqueNormalized.length,
        totalSegments,
        result: sendResult,
      })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to execute campaign operation' },
      { status: 500 }
    )
  }
}
