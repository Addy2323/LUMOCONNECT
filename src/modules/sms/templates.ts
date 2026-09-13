/**
 * SMS Template Engine & Segment Cost Estimator
 *
 * Supports English and Swahili templates, variable validation,
 * and GSM-7 vs Unicode SMS segment calculation.
 */

export interface SmsTemplateDefinition {
  code: string
  name: string
  category: 'AUTHENTICATION' | 'ORDERS' | 'FINANCIAL' | 'COMPLIANCE' | 'SUBSCRIPTIONS' | 'MARKETING'
  description: string
  requiredVariables: string[]
  templateEn: string
  templateSw: string
}

export interface RenderedTemplate {
  templateCode: string
  language: 'EN' | 'SW'
  messageText: string
  characterCount: number
  isGsm7: boolean
  segmentCount: number
}

// GSM-7 Basic Character Set regular expression
const GSM7_REGEX = /^[@£$¥èéùìòÇ\r\nØø\r\nÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑÜ§¿a-zäöñüà^{}\\[~\]|€]*$/

/**
 * Checks if a string contains only characters within the GSM-7 character set
 */
export function isGsm7String(text: string): boolean {
  return GSM7_REGEX.test(text)
}

/**
 * Calculates billable SMS segments according to telco standards:
 * - GSM-7: 160 chars for single part, 153 chars per part for multipart
 * - Unicode (UCS-2): 70 chars for single part, 67 chars per part for multipart
 */
export function calculateSmsSegments(text: string): {
  characterCount: number
  isGsm7: boolean
  segmentCount: number
  maxCharsPerSegment: number
} {
  const characterCount = text.length
  if (characterCount === 0) {
    return { characterCount: 0, isGsm7: true, segmentCount: 0, maxCharsPerSegment: 160 }
  }

  const isGsm7 = isGsm7String(text)

  if (isGsm7) {
    if (characterCount <= 160) {
      return { characterCount, isGsm7, segmentCount: 1, maxCharsPerSegment: 160 }
    }
    return {
      characterCount,
      isGsm7,
      segmentCount: Math.ceil(characterCount / 153),
      maxCharsPerSegment: 153,
    }
  } else {
    if (characterCount <= 70) {
      return { characterCount, isGsm7, segmentCount: 1, maxCharsPerSegment: 70 }
    }
    return {
      characterCount,
      isGsm7,
      segmentCount: Math.ceil(characterCount / 67),
      maxCharsPerSegment: 67,
    }
  }
}

/**
 * System Transactional Templates in English and Swahili
 */
export const SYSTEM_SMS_TEMPLATES: Record<string, SmsTemplateDefinition> = {
  USER_REGISTRATION_OTP: {
    code: 'USER_REGISTRATION_OTP',
    name: 'Registration Verification OTP',
    category: 'AUTHENTICATION',
    description: 'Dispatched during sign-up to verify customer or partner phone ownership.',
    requiredVariables: ['code'],
    templateEn: 'Your LUMO verification code is {{code}}. Valid for 10 minutes. Do not share this code.',
    templateSw: 'Nambari yako ya uthibitisho wa LUMO ni {{code}}. Ni halali kwa dakika 10. Usishirikishe mtu yeyote.',
  },
  PASSWORD_RESET_OTP: {
    code: 'PASSWORD_RESET_OTP',
    name: 'Password Recovery OTP',
    category: 'AUTHENTICATION',
    description: 'Dispatched when requesting account password reset.',
    requiredVariables: ['code'],
    templateEn: 'Your LUMO password reset code is {{code}}. Valid for 10 minutes. If you did not request this, ignore.',
    templateSw: 'Nambari ya kuweka upya nenosiri la LUMO ni {{code}}. Ni halali kwa dakika 10. Kama hukuomba, puuza.',
  },
  PASSWORD_CHANGED: {
    code: 'PASSWORD_CHANGED',
    name: 'Password Changed Notice',
    category: 'AUTHENTICATION',
    description: 'Security confirmation sent when password has been updated.',
    requiredVariables: [],
    templateEn: 'Your LUMO account password was updated successfully. If you did not make this change, contact support immediately.',
    templateSw: 'Nenosiri la akaunti yako ya LUMO limebadilishwa kikamilifu. Kama sio wewe, wasiliana na usaidizi mara moja.',
  },
  ORDER_PLACED: {
    code: 'ORDER_PLACED',
    name: 'Customer Order Placed',
    category: 'ORDERS',
    description: 'Sent when customer creates a new purchase order.',
    requiredVariables: ['order_number', 'amount'],
    templateEn: 'Order {{order_number}} received! Amount: TZS {{amount}}. Merchant is preparing your delivery.',
    templateSw: 'Agizo {{order_number}} limepokelewa! Kiasi: TZS {{amount}}. Muuzaji anaandaa uwasilishaji wako.',
  },
  PAYMENT_RECEIVED: {
    code: 'PAYMENT_RECEIVED',
    name: 'Payment Confirmed / Settlement Evidence',
    category: 'FINANCIAL',
    description: 'Sent ONLY after verified settlement evidence is received.',
    requiredVariables: ['order_number', 'amount'],
    templateEn: 'Payment of TZS {{amount}} confirmed for Order {{order_number}}. Funds are secured under LUMO buyer protection.',
    templateSw: 'Malipo ya TZS {{amount}} yamethibitishwa kwa Agizo {{order_number}}. Fedha zimelindwa chini ya LUMO.',
  },
  ORDER_COMPLETED: {
    code: 'ORDER_COMPLETED',
    name: 'Order Completed & Thank You',
    category: 'ORDERS',
    description: 'Sent when delivery note is accepted and order completes.',
    requiredVariables: ['order_number'],
    templateEn: 'Order {{order_number}} has been delivered and completed! Thank you for choosing LUMO.',
    templateSw: 'Agizo {{order_number}} limewasilishwa na kukamilika! Asante kwa kuchagua LUMO.',
  },
  BUSINESS_KYB_DECISION: {
    code: 'BUSINESS_KYB_DECISION',
    name: 'Business KYB Verification Decision',
    category: 'COMPLIANCE',
    description: 'Sent when compliance officer approves, rejects, or requests info.',
    requiredVariables: ['decision'],
    templateEn: 'LUMO Update: Your business verification application has been {{decision}}.',
    templateSw: 'Taarifa ya LUMO: Ombi lako la uthibitisho wa biashara {{decision}}.',
  },
  PARTNER_APPLICATION_DECISION: {
    code: 'PARTNER_APPLICATION_DECISION',
    name: 'Partner Application Decision',
    category: 'COMPLIANCE',
    description: 'Sent when partner application is approved or returned.',
    requiredVariables: ['decision'],
    templateEn: 'LUMO Partner Update: Your application has been {{decision}}.',
    templateSw: 'Taarifa ya Mshirika wa LUMO: Ombi lako {{decision}}.',
  },
  OPPORTUNITY_STATUS_UPDATE: {
    code: 'OPPORTUNITY_STATUS_UPDATE',
    name: 'Deal / Opportunity Status Alert',
    category: 'ORDERS',
    description: 'Notifies merchant or partners of deal publication or pause.',
    requiredVariables: ['deal_title', 'status'],
    templateEn: 'Opportunity "{{deal_title}}" status is now {{status}} on LUMO.',
    templateSw: 'Fursa ya "{{deal_title}}" sasa ipo katika hali ya {{status}} ndani ya LUMO.',
  },
  REWARD_EARNED: {
    code: 'REWARD_EARNED',
    name: 'Verified Commission / Reward Earned',
    category: 'FINANCIAL',
    description: 'Sent when partner conversion is verified.',
    requiredVariables: ['partner_name', 'amount', 'deal_title'],
    templateEn: 'Hongera {{partner_name}}! You earned a verified reward of TZS {{amount}} on deal "{{deal_title}}".',
    templateSw: 'Hongera {{partner_name}}! Umepata mgao wa TZS {{amount}} kwa fursa ya "{{deal_title}}".',
  },
  PAYOUT_CONFIRMED: {
    code: 'PAYOUT_CONFIRMED',
    name: 'Confirmed Payout Disbursed',
    category: 'FINANCIAL',
    description: 'Sent ONLY after confirmed payout completion.',
    requiredVariables: ['amount', 'payout_ref', 'payout_destination'],
    templateEn: 'LUMO Payout: TZS {{amount}} (Ref: {{payout_ref}}) has been disbursed to {{payout_destination}}.',
    templateSw: 'LUMO Malipo: TZS {{amount}} (Ref: {{payout_ref}}) imetumwa kwenda {{payout_destination}}.',
  },
  SUBSCRIPTION_ACTIVATED: {
    code: 'SUBSCRIPTION_ACTIVATED',
    name: 'Partner / VIP Subscription Activated',
    category: 'SUBSCRIPTIONS',
    description: 'Sent upon successful subscription payment authorization.',
    requiredVariables: ['plan_name', 'expiry_date'],
    templateEn: 'Your LUMO {{plan_name}} subscription is now active! Valid until {{expiry_date}}.',
    templateSw: 'Kifurushi chako cha LUMO {{plan_name}} kimeamilishwa kikamilifu! Ni halali hadi {{expiry_date}}.',
  },
  SUBSCRIPTION_EXPIRING_SOON: {
    code: 'SUBSCRIPTION_EXPIRING_SOON',
    name: 'Subscription Expiry Notice',
    category: 'SUBSCRIPTIONS',
    description: 'Sent 3 days prior to partner subscription expiration.',
    requiredVariables: ['plan_name', 'expiry_date'],
    templateEn: 'Reminder: Your LUMO {{plan_name}} access expires on {{expiry_date}}. Renew today to retain full access.',
    templateSw: 'Kumbusho: Kifurushi chako cha LUMO {{plan_name}} kitaisha tarehe {{expiry_date}}. Lipa sasa kuendelea.',
  },
}

/**
 * Renders a template with variable substitution and validation
 */
export function renderTemplate(
  templateCode: string,
  variables: Record<string, string | number>,
  language: 'EN' | 'SW' = 'EN'
): RenderedTemplate {
  const def = SYSTEM_SMS_TEMPLATES[templateCode]
  if (!def) {
    throw new Error(`Unknown SMS template code: ${templateCode}`)
  }

  // Validate required variables
  for (const reqVar of def.requiredVariables) {
    if (variables[reqVar] === undefined || variables[reqVar] === null || variables[reqVar] === '') {
      throw new Error(`Missing required template variable "{{${reqVar}}}" for template ${templateCode}`)
    }
  }

  const rawTemplate = language === 'SW' ? def.templateSw : def.templateEn
  let messageText = rawTemplate

  for (const [key, value] of Object.entries(variables)) {
    // Sanitizes and constrains variable text to single line
    const cleanValue = String(value).replace(/[\r\n\t]+/g, ' ').trim()
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    messageText = messageText.replace(regex, cleanValue)
  }

  const segments = calculateSmsSegments(messageText)

  return {
    templateCode,
    language,
    messageText,
    characterCount: segments.characterCount,
    isGsm7: segments.isGsm7,
    segmentCount: segments.segmentCount,
  }
}
