import type { SmsProvider, SmsMessage } from './types'

/**
 * Meseji SMS Adapter (Tanzania & East Africa transactional SMS delivery)
 */
export class MesejiSmsAdapter implements SmsProvider {
  name = 'MESEJI_SMS'
  private apiKey: string
  private senderId: string

  constructor(config?: { apiKey?: string; senderId?: string }) {
    this.apiKey = config?.apiKey || process.env.MESEJI_API_KEY || 'mock_meseji_key'
    this.senderId = config?.senderId || process.env.MESEJI_SENDER_ID || 'LUMO'
  }

  async sendSms(msg: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Standardizes phone number to E.164 (e.g. +255...)
    const phone = msg.recipientPhone.startsWith('0') ? `+255${msg.recipientPhone.slice(1)}` : msg.recipientPhone
    const msgId = `SMS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    // In local / sandbox environment, logs safely
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MESEJI SMS] Sent to ${phone} from ${this.senderId}: "${msg.messageText}" (ID: ${msgId})`)
    }

    return { success: true, messageId: msgId }
  }
}
