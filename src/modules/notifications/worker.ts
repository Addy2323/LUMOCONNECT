/**
 * LUMO Multi-Channel Notification Dispatch Worker
 *
 * Consumes Outbox events and dispatches:
 * - SMS alerts via Meseji (Vodacom, Airtel, Tigo, Halotel) using standardized templates
 * - Transactional Emails via SMTP / Mailpit
 * - In-App Notifications
 *
 * Transaction Safety:
 * - SMS dispatch failures are non-blocking and NEVER roll back financial transactions.
 * - Outbox errors are logged cleanly without leaking API keys.
 */

import { registerOutboxHandler, type OutboxEventRecord } from '@/lib/outbox'
import { providers } from '@/lib/providers'
import { renderTemplate } from '@/modules/sms/templates'
import { sendNotification } from './service'

let isInitialized = false

/**
 * Safely dispatches an SMS message without throwing errors to the parent workflow
 */
async function safeSendSms(recipientPhone: string, messageText: string, metadata?: Record<string, unknown>): Promise<void> {
  try {
    if (!recipientPhone) return
    await providers.sms.sendSms({
      recipientPhone,
      messageText,
      metadata,
    })
  } catch (error) {
    // Non-blocking: log error without breaking business operations
    console.error('[SMS_DISPATCH_WORKER_ERROR]', {
      recipient: recipientPhone.slice(0, 6) + '***',
      error: error instanceof Error ? error.message : 'Unknown dispatch error',
    })
  }
}

export function initializeNotificationWorker(): void {
  if (isInitialized) return
  isInitialized = true

  // 1. Conversion recorded notification (Reward Earned)
  registerOutboxHandler('CONVERSION_RECORDED', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      conversionId?: string
      partnerId?: string
      partnerName?: string
      customerPhone?: string
      partnerPhone?: string
      netPayableMinor?: string
      amountMinor?: string
      dealTitle?: string
      dealId?: string
    }

    const rawAmount = payload.netPayableMinor || payload.amountMinor || '0'
    const netTZS = (parseInt(rawAmount, 10) / 100).toLocaleString()
    const partnerName = payload.partnerName || 'Partner'
    const dealTitle = payload.dealTitle || 'Verified Referral'

    // Dispatch in-app notification
    if (payload.partnerId) {
      await sendNotification({
        userId: payload.partnerId,
        title: 'Mauzo mapya yamethibitishwa / New conversion verified',
        message: `Hongera! Umepata TZS ${netTZS}. Ref #${(payload.conversionId || event.aggregateId).slice(-6)}.`,
        linkUrl: '/partner',
      }).catch(() => {})
    }

    // Dispatch SMS via Meseji
    const targetPhone = payload.partnerPhone || payload.customerPhone || '+255712345678'
    const rendered = renderTemplate('REWARD_EARNED', {
      partner_name: partnerName,
      amount: netTZS,
      deal_title: dealTitle,
    }, 'SW')

    await safeSendSms(targetPhone, rendered.messageText, {
      templateCode: 'REWARD_EARNED',
      conversionId: payload.conversionId || event.aggregateId,
    })
  })

  // 2. Confirmed Payout Disbursed
  registerOutboxHandler('PAYOUT_DISBURSED', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      payoutNumber?: string
      amountMinor?: string
      destinationPhone?: string
      destinationWallet?: string
      recipientEmail?: string
    }

    const totalTZS = (parseInt(payload.amountMinor || '0', 10) / 100).toLocaleString()
    const payoutRef = payload.payoutNumber || event.aggregateId
    const destination = payload.destinationWallet || 'Mobile Money'

    const rendered = renderTemplate('PAYOUT_CONFIRMED', {
      amount: totalTZS,
      payout_ref: payoutRef,
      payout_destination: destination,
    }, 'SW')

    const targetPhone = payload.destinationPhone || '+255712345678'
    await safeSendSms(targetPhone, rendered.messageText, {
      templateCode: 'PAYOUT_CONFIRMED',
      payoutRef,
    })

    if (payload.recipientEmail) {
      await providers.email.sendEmail({
        to: payload.recipientEmail,
        subject: `LUMO Payout Disbursed — ${payoutRef}`,
        htmlBody: `<p>Your payout batch <strong>${payoutRef}</strong> for TZS ${totalTZS} has been authorized and disbursed to your mobile money wallet.</p>`,
        textBody: `Your payout batch ${payoutRef} for TZS ${totalTZS} has been authorized and disbursed to your mobile money wallet.`,
      }).catch(() => {})
    }
  })

  // 3. Payment Confirmed / Settlement Evidence Received
  registerOutboxHandler('PAYMENT_RECEIVED', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      orderNumber: string
      amountMinor?: string
      customerPhone?: string
    }

    const amountTZS = (parseInt(payload.amountMinor || '0', 10) / 100).toLocaleString()
    const rendered = renderTemplate('PAYMENT_RECEIVED', {
      order_number: payload.orderNumber,
      amount: amountTZS,
    }, 'SW')

    if (payload.customerPhone) {
      await safeSendSms(payload.customerPhone, rendered.messageText, {
        templateCode: 'PAYMENT_RECEIVED',
        orderNumber: payload.orderNumber,
      })
    }
  })

  // 4. Customer Order Placed
  registerOutboxHandler('ORDER_PLACED', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      orderNumber: string
      amountMinor?: string
      customerPhone?: string
    }

    const amountTZS = (parseInt(payload.amountMinor || '0', 10) / 100).toLocaleString()
    const rendered = renderTemplate('ORDER_PLACED', {
      order_number: payload.orderNumber,
      amount: amountTZS,
    }, 'SW')

    if (payload.customerPhone) {
      await safeSendSms(payload.customerPhone, rendered.messageText, {
        templateCode: 'ORDER_PLACED',
        orderNumber: payload.orderNumber,
      })
    }
  })

  // 5. Order Completed
  registerOutboxHandler('ORDER_COMPLETED', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      orderNumber: string
      customerPhone?: string
    }

    const rendered = renderTemplate('ORDER_COMPLETED', {
      order_number: payload.orderNumber,
    }, 'SW')

    if (payload.customerPhone) {
      await safeSendSms(payload.customerPhone, rendered.messageText, {
        templateCode: 'ORDER_COMPLETED',
        orderNumber: payload.orderNumber,
      })
    }
  })

  // 6. Business KYB Verification Decision
  registerOutboxHandler('BUSINESS_KYB_DECISION', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      decision: string
      phone?: string
      businessName?: string
    }

    const rendered = renderTemplate('BUSINESS_KYB_DECISION', {
      decision: payload.decision,
    }, 'SW')

    if (payload.phone) {
      await safeSendSms(payload.phone, rendered.messageText, {
        templateCode: 'BUSINESS_KYB_DECISION',
        decision: payload.decision,
      })
    }
  })

  // 7. Partner Application Decision
  registerOutboxHandler('PARTNER_APPLICATION_DECISION', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      decision: string
      phone?: string
    }

    const rendered = renderTemplate('PARTNER_APPLICATION_DECISION', {
      decision: payload.decision,
    }, 'SW')

    if (payload.phone) {
      await safeSendSms(payload.phone, rendered.messageText, {
        templateCode: 'PARTNER_APPLICATION_DECISION',
        decision: payload.decision,
      })
    }
  })

  // 8. Subscription Activated
  registerOutboxHandler('SUBSCRIPTION_ACTIVATED', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      planName: string
      expiryDate: string
      phone?: string
    }

    const rendered = renderTemplate('SUBSCRIPTION_ACTIVATED', {
      plan_name: payload.planName,
      expiry_date: payload.expiryDate,
    }, 'SW')

    if (payload.phone) {
      await safeSendSms(payload.phone, rendered.messageText, {
        templateCode: 'SUBSCRIPTION_ACTIVATED',
      })
    }
  })

  // 9. Subscription Expiring Soon
  registerOutboxHandler('SUBSCRIPTION_EXPIRING_SOON', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      planName: string
      expiryDate: string
      phone?: string
    }

    const rendered = renderTemplate('SUBSCRIPTION_EXPIRING_SOON', {
      plan_name: payload.planName,
      expiry_date: payload.expiryDate,
    }, 'SW')

    if (payload.phone) {
      await safeSendSms(payload.phone, rendered.messageText, {
        templateCode: 'SUBSCRIPTION_EXPIRING_SOON',
      })
    }
  })

  // 10. Generic Notification Dispatch
  registerOutboxHandler('NOTIFICATION_DISPATCH', async (event: OutboxEventRecord) => {
    const payload = event.payload as {
      deliverableTitle?: string
      status?: string
      phone?: string
      title?: string
      message?: string
    }

    if (payload.deliverableTitle) {
      const targetPhone = payload.phone || '+255712345678'
      await safeSendSms(
        targetPhone,
        `LUMO: Hali ya kazi "${payload.deliverableTitle}" ni ${payload.status || 'UPDATED'}.`
      )
    }
  })
}

// Auto-initialize worker handlers upon import
initializeNotificationWorker()
