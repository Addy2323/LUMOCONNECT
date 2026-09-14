/**
 * Tanzania Mobile Phone Parser, Normalizer & Operator Classifier
 *
 * Meseji requires international digits-only format: 255XXXXXXXXX
 */

export type TanzaniaMobileOperator = 'VODACOM' | 'AIRTEL' | 'TIGO' | 'HALOTEL' | 'TTCL' | 'ZANTEL' | 'UNKNOWN'

export interface ParsedPhone {
  raw: string
  normalized: string
  isValid: boolean
  operator: TanzaniaMobileOperator
  masked: string
}

/**
 * Normalizes Tanzanian phone numbers to standard 12-digit Meseji format: "255XXXXXXXXX"
 */
export function normalizeMesejiPhone(input: string): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')

  if (digits.startsWith('255') && digits.length === 12) {
    return digits
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `255${digits.slice(1)}`
  }
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    return `255${digits}`
  }
  return digits
}

export const normalizeTanzaniaPhone = normalizeMesejiPhone
export const normalizeBeemPhone = normalizeMesejiPhone

/**
 * Detects Tanzanian mobile network operator based on national dial code allocation
 */
export function detectTanzaniaOperator(phone: string): TanzaniaMobileOperator {
  const normalized = normalizeMesejiPhone(phone)
  if (!normalized.startsWith('255') || normalized.length !== 12) {
    return 'UNKNOWN'
  }
  const prefix2 = normalized.slice(3, 5) // e.g. "75", "78", "71"

  // Vodacom: 74, 75, 76
  if (['74', '75', '76'].includes(prefix2)) return 'VODACOM'
  // Airtel: 78, 79, 68, 69
  if (['78', '79', '68', '69'].includes(prefix2)) return 'AIRTEL'
  // Tigo (Mixx by Yas): 71, 65, 67
  if (['71', '65', '67'].includes(prefix2)) return 'TIGO'
  // Halotel: 61, 62
  if (['61', '62'].includes(prefix2)) return 'HALOTEL'
  // TTCL: 73
  if (prefix2 === '73') return 'TTCL'
  // Zantel: 77
  if (prefix2 === '77') return 'ZANTEL'

  return 'UNKNOWN'
}

/**
 * Validates Tanzanian mobile phone number
 */
export function isValidTanzaniaPhone(input: string): boolean {
  const norm = normalizeMesejiPhone(input)
  if (norm.length !== 12 || !norm.startsWith('255')) {
    return false
  }
  // 4th digit must be 6 or 7
  const fourthDigit = norm.charAt(3)
  return fourthDigit === '6' || fourthDigit === '7'
}

/**
 * Masks phone numbers to protect customer privacy in public/admin views
 * Example: "255781234567" -> "25578***4567"
 */
export function maskPhoneNumber(phone: string): string {
  const norm = normalizeMesejiPhone(phone)
  if (norm.length >= 10) {
    return `${norm.slice(0, 5)}***${norm.slice(-4)}`
  }
  return '***'
}

/**
 * Complete parser utility
 */
export function parsePhone(input: string): ParsedPhone {
  const normalized = normalizeMesejiPhone(input)
  const isValid = isValidTanzaniaPhone(normalized)
  const operator = detectTanzaniaOperator(normalized)
  const masked = maskPhoneNumber(normalized)

  return {
    raw: input,
    normalized,
    isValid,
    operator,
    masked,
  }
}
