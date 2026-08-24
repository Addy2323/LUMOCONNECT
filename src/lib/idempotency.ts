/**
 * LUMO Idempotency Key Generator
 *
 * Generates unique, URL-safe idempotency keys for:
 * - Payment attempts
 * - Funding transactions
 * - Payout references
 * - Conversion tracking
 * - Webhook processing
 *
 * Uses nanoid for collision-resistant, compact IDs.
 */

import { nanoid } from 'nanoid'

/**
 * Generates a prefixed idempotency key.
 *
 * @param prefix - Short identifier for the operation type (e.g. "pay", "fund", "po", "conv")
 * @param length - Length of the random segment (default 21)
 * @returns Formatted key like "pay_V1StGXR8_Z5jdHi6BQ3h"
 */
export function generateIdempotencyKey(prefix: string, length: number = 21): string {
  return `${prefix}_${nanoid(length)}`
}

/**
 * Generates a payment attempt idempotency key.
 * Format: "pay_<21-char nanoid>"
 */
export function paymentKey(): string {
  return generateIdempotencyKey('pay')
}

/**
 * Generates a funding transaction idempotency key.
 * Format: "fund_<21-char nanoid>"
 */
export function fundingKey(): string {
  return generateIdempotencyKey('fund')
}

/**
 * Generates a payout idempotency key.
 * Format: "po_<21-char nanoid>"
 */
export function payoutKey(): string {
  return generateIdempotencyKey('po')
}

/**
 * Generates a conversion idempotency key.
 * Format: "conv_<21-char nanoid>"
 */
export function conversionKey(): string {
  return generateIdempotencyKey('conv')
}

/**
 * Generates a webhook processing idempotency key.
 * Format: "wh_<21-char nanoid>"
 */
export function webhookKey(): string {
  return generateIdempotencyKey('wh')
}

/**
 * Generates a fraud case number.
 * Format: "FC-<8-char uppercase nanoid>"
 */
export function fraudCaseNumber(): string {
  return `FC-${nanoid(8).toUpperCase()}`
}

/**
 * Generates a short tracking asset code.
 * Format: "LM-<8-char nanoid>"
 */
export function trackingCode(): string {
  return `LM-${nanoid(8)}`
}
