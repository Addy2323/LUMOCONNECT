/**
 * Production Beem Africa SMS & OTP Adapters for LUMO
 *
 * Conforms to decoupled SmsProvider and OtpProvider interfaces.
 */

import type { SmsProvider, SmsMessage, OtpProvider, OtpRequest, OtpRequestResult, OtpVerifyRequest, OtpVerifyResult } from './types'
import { BeemClient, type BeemConfig } from './beem-client'
import { normalizeTanzaniaPhone, maskPhoneNumber } from '@/modules/sms/phone'

export { BeemClient }

export class BeemSmsAdapter implements SmsProvider {
  name = 'BEEM_SMS'
  private client: BeemClient

  constructor(configOrClient?: BeemConfig | BeemClient) {
    if (configOrClient instanceof BeemClient) {
      this.client = configOrClient
    } else {
      this.client = new BeemClient(configOrClient)
    }
  }

  getClient(): BeemClient {
    return this.client
  }

  async sendSms(msg: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const normalizedPhone = normalizeTanzaniaPhone(msg.recipientPhone)
    const senderId = msg.senderId || this.client.configuredSenderId

    const res = await this.client.sendSms({
      source_addr: senderId,
      message: msg.messageText,
      recipients: [normalizedPhone],
    })

    if (!res.successful) {
      return {
        success: false,
        messageId: res.request_id,
        error: res.error || res.message || 'Failed to dispatch SMS via Beem Africa',
      }
    }

    const masked = maskPhoneNumber(normalizedPhone)
    if (process.env.NODE_ENV !== 'production' && res.isDryRun) {
      console.log(`[BEEM SMS DRY-RUN] Dispatched to ${masked} from ${senderId}: "${msg.messageText.slice(0, 40)}..." (ReqId: ${res.request_id})`)
    }

    return {
      success: true,
      messageId: res.request_id,
    }
  }
}

export class BeemOtpAdapter implements OtpProvider {
  name = 'BEEM_OTP'
  private client: BeemClient

  constructor(configOrClient?: BeemConfig | BeemClient) {
    if (configOrClient instanceof BeemClient) {
      this.client = configOrClient
    } else {
      this.client = new BeemClient(configOrClient)
    }
  }

  getClient(): BeemClient {
    return this.client
  }

  async requestOtp(req: OtpRequest): Promise<OtpRequestResult> {
    const res = await this.client.requestOtp({
      msisdn: req.phone,
      appId: req.appId,
    })

    return {
      success: res.success,
      pinId: res.pinId,
      code: res.code,
      message: res.message,
      pinExpiryMinutes: res.pinExpiryMinutes,
      expiresInSeconds: res.expiresInSeconds,
      error: res.error,
    }
  }

  async verifyOtp(req: OtpVerifyRequest): Promise<OtpVerifyResult> {
    const res = await this.client.verifyOtp({
      pinId: req.pinId,
      pin: req.pin,
    })

    return {
      success: res.success,
      code: res.code,
      message: res.message,
      error: res.error,
    }
  }
}
