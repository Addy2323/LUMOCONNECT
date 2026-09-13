import type { SmsProvider, SmsMessage } from './types'
import { MesejiClient, type MesejiConfig } from './meseji-client'
import { normalizeMesejiPhone, maskPhoneNumber } from '@/modules/sms/phone'

export { MesejiClient }

/**
 * Production Meseji SMS Adapter for LUMO
 * Conforms to decoupled SmsProvider interface while leveraging MesejiClient.
 */
export class MesejiSmsAdapter implements SmsProvider {
  name = 'MESEJI_SMS'
  private client: MesejiClient

  constructor(config?: MesejiConfig) {
    this.client = new MesejiClient(config)
  }

  getClient(): MesejiClient {
    return this.client
  }

  async sendSms(msg: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const normalizedPhone = normalizeMesejiPhone(msg.recipientPhone)
    const senderId = msg.senderId || this.client.configuredSenderId

    const res = await this.client.sendSms({
      sender_id: senderId,
      message: msg.messageText,
      contacts: normalizedPhone,
    })

    if (!res.success) {
      return { success: false, error: res.error || 'Failed to dispatch SMS via Meseji' }
    }

    const masked = maskPhoneNumber(normalizedPhone)
    if (process.env.NODE_ENV !== 'production' && res.isDryRun) {
      console.log(`[MESEJI SMS DRY-RUN] Dispatched to ${masked} from ${senderId}: "${msg.messageText.slice(0, 40)}..." (Batch: ${res.batch_id})`)
    }

    return {
      success: true,
      messageId: res.batch_id || `SMS-${Date.now()}`,
    }
  }
}
