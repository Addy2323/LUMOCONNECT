import { describe, it, expect, beforeEach } from 'vitest'
import {
  normalizeTanzaniaPhone,
  isValidTanzaniaPhone,
  detectTanzaniaOperator,
  maskPhoneNumber,
  normalizeMesejiPhone,
} from '@/modules/sms/phone'
import {
  calculateSmsSegments,
  isGsm7String,
  renderTemplate,
  SYSTEM_SMS_TEMPLATES,
} from '@/modules/sms/templates'
import { MesejiClient } from '@/lib/providers/meseji-client'
import {
  resetSmsStore,
  recordSmsJob,
  getSmsJobById,
  updateSmsJobStatus,
  createSmsCampaign,
  recordFundingAttempt,
  getSmsStoreSummary,
} from '@/modules/sms/store'

describe('Meseji SMS - Phone Normalization & Operators', () => {
  it('normalizes various local formats to 255XXXXXXXXX', () => {
    expect(normalizeTanzaniaPhone('0712345678')).toBe('255712345678')
    expect(normalizeTanzaniaPhone('+255712345678')).toBe('255712345678')
    expect(normalizeTanzaniaPhone('255712345678')).toBe('255712345678')
    expect(normalizeTanzaniaPhone('712345678')).toBe('255712345678')
    expect(normalizeTanzaniaPhone('0754 123 456')).toBe('255754123456')
    expect(normalizeTanzaniaPhone('+255-789-654-321')).toBe('255789654321')
  })

  it('validates Tanzanian phone numbers accurately', () => {
    expect(isValidTanzaniaPhone('0712345678')).toBe(true)
    expect(isValidTanzaniaPhone('0754123456')).toBe(true)
    expect(isValidTanzaniaPhone('0784123456')).toBe(true)
    expect(isValidTanzaniaPhone('0624123456')).toBe(true)
    expect(isValidTanzaniaPhone('0734123456')).toBe(true)

    // Invalid numbers
    expect(isValidTanzaniaPhone('0123456789')).toBe(false)
    expect(isValidTanzaniaPhone('12345')).toBe(false)
    expect(isValidTanzaniaPhone('07123456789999')).toBe(false)
    expect(isValidTanzaniaPhone('abcdef')).toBe(false)
  })

  it('accurately identifies Tanzanian mobile network operators', () => {
    expect(detectTanzaniaOperator('0754123456')).toBe('VODACOM')
    expect(detectTanzaniaOperator('0762123456')).toBe('VODACOM')
    expect(detectTanzaniaOperator('0784123456')).toBe('AIRTEL')
    expect(detectTanzaniaOperator('0799123456')).toBe('AIRTEL')
    expect(detectTanzaniaOperator('0712123456')).toBe('TIGO')
    expect(detectTanzaniaOperator('0655123456')).toBe('TIGO')
    expect(detectTanzaniaOperator('0624123456')).toBe('HALOTEL')
    expect(detectTanzaniaOperator('0732123456')).toBe('TTCL')
    expect(detectTanzaniaOperator('0772123456')).toBe('ZANTEL')
  })

  it('masks phone numbers for privacy preservation in UI and logs', () => {
    expect(maskPhoneNumber('255784123456')).toBe('25578***3456')
    expect(maskPhoneNumber('0712345678')).toBe('25571***5678')
    expect(maskPhoneNumber('123')).toBe('***')
  })
})

describe('Meseji SMS - Templates & Segment Mathematics', () => {
  it('correctly identifies GSM-7 vs Unicode characters', () => {
    expect(isGsm7String('Hello world 123! @#$%&*()')).toBe(true)
    expect(isGsm7String('Habari ya asubuhi, karibu LUMO.')).toBe(true)
    // Emojis or special unicode characters trigger Unicode (UCS-2)
    expect(isGsm7String('Hello 🎉 LUMO')).toBe(false)
    expect(isGsm7String('Special characters: 🚀')).toBe(false)
  })

  it('calculates GSM-7 segments accurately (160 single, 153 multipart)', () => {
    const shortText = 'A'.repeat(160)
    const shortCalc = calculateSmsSegments(shortText)
    expect(shortCalc.characterCount).toBe(160)
    expect(shortCalc.isGsm7).toBe(true)
    expect(shortCalc.segmentCount).toBe(1)
    expect(shortCalc.maxCharsPerSegment).toBe(160)

    const twoPartText = 'A'.repeat(161)
    const twoPartCalc = calculateSmsSegments(twoPartText)
    expect(twoPartCalc.characterCount).toBe(161)
    expect(twoPartCalc.segmentCount).toBe(2)
    expect(twoPartCalc.maxCharsPerSegment).toBe(153)

    const threePartText = 'A'.repeat(307)
    const threePartCalc = calculateSmsSegments(threePartText)
    expect(threePartCalc.segmentCount).toBe(3)
  })

  it('calculates Unicode segments accurately (70 single, 67 multipart)', () => {
    const unicodeShort = '🎉 Hello from LUMO!'
    const calcShort = calculateSmsSegments(unicodeShort)
    expect(calcShort.isGsm7).toBe(false)
    expect(calcShort.segmentCount).toBe(1)
    expect(calcShort.maxCharsPerSegment).toBe(70)

    const unicodeLong = '🎉 ' + 'A'.repeat(75)
    const calcLong = calculateSmsSegments(unicodeLong)
    expect(calcLong.isGsm7).toBe(false)
    expect(calcLong.segmentCount).toBe(2)
    expect(calcLong.maxCharsPerSegment).toBe(67)
  })

  it('renders standard transactional templates in English and Swahili', () => {
    // 1. Registration OTP
    const otpEn = renderTemplate('USER_REGISTRATION_OTP', { code: '482910' }, 'EN')
    expect(otpEn.messageText).toContain('482910')
    expect(otpEn.messageText).toContain('verification code')

    const otpSw = renderTemplate('USER_REGISTRATION_OTP', { code: '482910' }, 'SW')
    expect(otpSw.messageText).toContain('482910')
    expect(otpSw.messageText).toContain('uthibitisho wa LUMO')

    // 2. Payment Received
    const payment = renderTemplate('PAYMENT_RECEIVED', {
      order_number: 'ORD-9912',
      amount: '150,000',
    }, 'EN')
    expect(payment.messageText).toContain('ORD-9912')
    expect(payment.messageText).toContain('150,000')

    // 3. Payout Confirmed
    const payout = renderTemplate('PAYOUT_CONFIRMED', {
      amount: '75,000',
      payout_ref: 'PAY-8821',
      payout_destination: 'M-Pesa 255754***456',
    }, 'SW')
    expect(payout.messageText).toContain('75,000')
    expect(payout.messageText).toContain('PAY-8821')
  })

  it('enforces required template variables and rejects missing fields', () => {
    expect(() => {
      renderTemplate('ORDER_PLACED', { order_number: 'ORD-123' }) // missing 'amount'
    }).toThrow(/Missing required template variable "{{amount}}"/)
  })
})

describe('Meseji SMS Client - Dry-Run & Gateway Operations', () => {
  let client: MesejiClient

  beforeEach(() => {
    resetSmsStore()
    // Instantiated in dry-run mode for deterministic offline testing
    client = new MesejiClient({
      baseUrl: 'https://meseji.co.tz/api/v1',
      apiKey: 'test_meseji_mock_key',
      senderId: 'Lumo',
      dryRun: true,
      enabled: false,
    })
  })

  it('handles sendSms in dry run without leaking credentials', async () => {
    const result = await client.sendSms({
      recipientPhone: '0712345678',
      messageText: 'LUMO Test verification alert',
    })

    expect(result.success).toBe(true)
    expect(result.isDryRun).toBe(true)
    expect(result.batchId).toBeDefined()
    expect(result.recipient).toBe('255712345678')
    expect(result.operator).toBe('TIGO')
  })

  it('handles sendBulkSms in dry run with deduplication', async () => {
    const result = await client.sendBulkSms({
      recipientPhones: ['0712345678', '0712345678', '0754123456'],
      messageText: 'LUMO Bulk Broadcast Announcement',
    })

    expect(result.success).toBe(true)
    expect(result.recipientCount).toBe(2) // Deduplicated
    expect(result.batchId).toBeDefined()
  })

  it('retrieves batch aggregate statistics', async () => {
    const stats = await client.getBatchStats('batch_mock_123')
    expect(stats.batch_id).toBe('batch_mock_123')
    expect(stats.status).toBe('COMPLETED')
    expect(stats.total_recipients).toBeGreaterThan(0)
  })

  it('retrieves user statistics / SMS balance', async () => {
    const userStats = await client.getUserStats()
    expect(userStats.balance).toBeGreaterThan(0)
    expect(userStats.currency).toBe('TZS')
  })

  it('manages sender IDs with TCRA compliance validation', async () => {
    const senderIds = await client.getSenderIds()
    expect(Array.isArray(senderIds.sender_ids)).toBe(true)
    expect(senderIds.sender_ids.some((s) => s.name === 'Lumo')).toBe(true)

    // Request new sender ID (validates 10 words requirement)
    await expect(
      client.requestSenderId({
        name: 'LUMOALERT',
        sampleMessage: 'Too short', // < 10 words
      })
    ).rejects.toThrow(/at least 10 words/)

    const requestResult = await client.requestSenderId({
      name: 'LUMOALERT',
      sampleMessage: 'Malipo yako ya TZS 50,000 kwa agizo namba ORD-102 yamethibitishwa kikamilifu kupitia huduma ya LUMO.',
    })
    expect(requestResult.success).toBe(true)
    expect(requestResult.name).toBe('LUMOALERT')
  })

  it('supports SMS credit purchases via USSD Push and ZenoPay', async () => {
    // USSD Push
    const ussdResult = await client.buySmsCredits({
      amount: 15000,
      phone: '0712345678',
      provider: 'TIGO',
    })
    expect(ussdResult.success).toBe(true)
    expect(ussdResult.amount).toBe(15000)

    // ZenoPay Gateway
    const zenoResult = await client.createZenopayOrder({
      amount: 25000,
      buyerEmail: 'admin@lumo.co.tz',
      buyerName: 'LUMO Admin',
      buyerPhone: '255712345678',
      webhookUrl: 'https://lumo.co.tz/api/webhooks/zenopay',
    })
    expect(zenoResult.success).toBe(true)
    expect(zenoResult.order_id).toBeDefined()
    expect(zenoResult.payment_url).toContain('checkout')

    // Check status
    const status = await client.getZenopayStatus(zenoResult.order_id)
    expect(status.order_id).toBe(zenoResult.order_id)
  })
})

describe('SMS Store & Lifecycle Audit', () => {
  beforeEach(() => {
    resetSmsStore()
  })

  it('records, queries, and updates SMS job lifecycles', () => {
    const job = recordSmsJob({
      recipientPhone: '255712345678',
      messageText: 'Your code is 123456',
      senderId: 'Lumo',
      channel: 'AUTH_OTP',
      operator: 'TIGO',
    })

    expect(job.id).toBeDefined()
    expect(job.status).toBe('PENDING')
    expect(job.recipientPhone).toBe('25571***5678') // Masked

    // Update to SUBMITTED
    const updated = updateSmsJobStatus(job.id, 'SUBMITTED', 'batch_test_1')
    expect(updated?.status).toBe('SUBMITTED')
    expect(updated?.batchId).toBe('batch_test_1')

    const retrieved = getSmsJobById(job.id)
    expect(retrieved?.status).toBe('SUBMITTED')
  })

  it('manages campaigns and funding attempts in audit store', () => {
    const campaign = createSmsCampaign({
      name: 'Spring Merchant Push',
      senderId: 'Lumo',
      messageText: 'Jiunge na LUMO leo!',
      totalRecipients: 50,
      totalSegments: 50,
      costEstimateTzs: 1250,
    })
    expect(campaign.name).toBe('Spring Merchant Push')

    const funding = recordFundingAttempt({
      method: 'USSD_PUSH',
      amountTzs: 10000,
      reference: 'ref_topup_1',
      status: 'PENDING',
      provider: 'M-PESA',
    })
    expect(funding.amountTzs).toBe(10000)

    const summary = getSmsStoreSummary()
    expect(summary.totalCampaigns).toBe(1)
    expect(summary.totalFundingAttempts).toBe(1)
  })
})
