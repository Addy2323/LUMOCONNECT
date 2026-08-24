/**
 * LUMO Multi-Channel Notification Dispatch Worker
 *
 * Consumes Outbox events and dispatches:
 * - SMS alerts via Meseji (Vodacom, Airtel, Tigo, Halotel)
 * - Transactional Emails via SMTP / Mailpit
 * - In-App Notifications
 */

import { registerOutboxHandler, type OutboxEventRecord } from '@/lib/outbox'
import { providers } from '@/lib/providers'
import { sendNotification } from './service'

let isInitialized = false

export function initializeNotificationWorker(): void {
  if (isInitialized) return
  isInitialized = true

  // 1. Conversion recorded notification
  registerOutboxHandler('CONVERSION_RECORDED', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      conversionId: string
      partnerId: string
      netPayableMinor: string
      dealId: string
    }

    const netTZS = (parseInt(payload.netPayableMinor || '0', 10) / 100).toLocaleString()

    // Dispatch in-app notification
    await sendNotification({
      userId: payload.partnerId,
      title: 'New Conversion Attributed! 💰',
      message: `Hongera! You earned TZS ${netTZS} from conversion #${payload.conversionId.slice(-6)}.`,
      linkUrl: '/partner',
      phone: '+255712345678',
      email: 'alex.mushi@lumo.co.tz',
    })

    // Dispatch SMS via Meseji
    await providers.sms.sendSms({
      recipientPhone: '+255712345678',
      messageText: `LUMO: Hongera! Umepata commission ya TZS ${netTZS} kutoka rufaa mpya. Ingia app kuangalia maelezo.`,
    })
  })

  // 2. Payout disbursed notification
  registerOutboxHandler('PAYOUT_DISBURSED', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      payoutNumber: string
      amountMinor: string
    }

    const totalTZS = (parseInt(payload.amountMinor || '0', 10) / 100).toLocaleString()

    await providers.sms.sendSms({
      recipientPhone: '+255712345678',
      messageText: `LUMO: Malipo yako ya TZS ${totalTZS} (${payload.payoutNumber}) yametumwa kwa M-Pesa. Ahsante kwa kufanya kazi na LUMO!`,
    })

    await providers.email.sendEmail({
      to: 'alex.mushi@lumo.co.tz',
      subject: `LUMO Payout Disbursed — ${payload.payoutNumber}`,
      htmlBody: `<p>Your payout batch <strong>${payload.payoutNumber}</strong> for TZS ${totalTZS} has been authorized and disbursed to your mobile money wallet.</p>`,
      textBody: `Your payout batch ${payload.payoutNumber} for TZS ${totalTZS} has been authorized and disbursed to your mobile money wallet.`,
    })
  })

  // 3. Generic notification dispatcher
  registerOutboxHandler('NOTIFICATION_DISPATCH', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      dealRoomId?: string
      deliverableTitle?: string
      disputeNumber?: string
      title?: string
      status?: string
    }

    if (payload.deliverableTitle) {
      await providers.sms.sendSms({
        recipientPhone: '+255712345678',
        messageText: `LUMO Deal Room: Deliverable "${payload.deliverableTitle}" status updated to ${payload.status || 'UPDATED'}.`,
      })
    }
  })
}

// Auto-initialize worker handlers upon import
initializeNotificationWorker()
