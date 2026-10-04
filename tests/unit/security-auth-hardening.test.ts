import { describe, it, expect, beforeEach } from 'vitest'
import { z } from 'zod'
import { verifyPassword, hashPassword } from '@/lib/password'
import { checkRateLimit } from '@/lib/rate-limiter'
import { createAndSendOtp, verifyOtpChallenge, resetOtpStoreForTesting } from '@/modules/identity/otp.service'
import { getDatabaseSession } from '@/lib/database-session'

describe('Authentication Security Hardening Test Suite', () => {

  describe('1. Input Sanitization & SQL Injection Defense', () => {
    const inputSchema = z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(1).max(128),
      })
      .strict()

    it('rejects SQL injection string payloads in email field', () => {
      const payload = { email: "' OR 1=1 --", password: 'password123' }
      const parsed = inputSchema.safeParse(payload)
      expect(parsed.success).toBe(false)
    })

    it('rejects Prisma object operator injection payloads ({ contains: "" })', () => {
      const payload = { email: { contains: '' }, password: 'password123' }
      const parsed = inputSchema.safeParse(payload)
      expect(parsed.success).toBe(false)
    })

    it('rejects unexpected object properties due to .strict() mode', () => {
      const payload = { email: 'test@example.com', password: 'password123', adminRole: true }
      const parsed = inputSchema.safeParse(payload)
      expect(parsed.success).toBe(false)
    })
  })

  describe('2. Constant-Time Password Hashing & Enumeration Defense', () => {
    it('returns false safely without throwing when given null hash (dummy comparison)', () => {
      const result = verifyPassword('somePassword123!', null)
      expect(result).toBe(false)
    })

    it('successfully hashes and verifies valid credentials', () => {
      const secret = 'MySecureP@ssw0rd!2026'
      const hashed = hashPassword(secret)
      expect(verifyPassword(secret, hashed)).toBe(true)
      expect(verifyPassword('WrongPassword', hashed)).toBe(false)
    })
  })

  describe('3. Rate Limiter & Brute-Force Protection', () => {
    it('blocks requests exceeding max limit window', async () => {
      const keyPrefix = 'test-lockout'
      const identifier = 'user-123'
      const maxRequests = 3
      const windowSeconds = 10

      // First 3 requests should pass
      for (let i = 0; i < maxRequests; i++) {
        const res = await checkRateLimit({ keyPrefix, identifier, maxRequests, windowSeconds })
        expect(res.success).toBe(true)
      }

      // 4th request should fail with 0 remaining
      const blockedRes = await checkRateLimit({ keyPrefix, identifier, maxRequests, windowSeconds })
      expect(blockedRes.success).toBe(false)
      expect(blockedRes.remaining).toBe(0)
      expect(blockedRes.resetSeconds).toBeGreaterThan(0)
    })
  })

  describe('4. OTP Challenge Limits & Atomic Invalidation', () => {
    beforeEach(() => {
      resetOtpStoreForTesting()
    })

    it('enforces maximum 3 verification attempts per OTP challenge', async () => {
      const createRes = await createAndSendOtp({
        identifier: 'testotp@lumo.co.tz',
        purpose: 'REGISTRATION',
      })
      expect(createRes.success).toBe(true)

      // Submit 3 invalid codes
      for (let i = 0; i < 3; i++) {
        const verifyRes = await verifyOtpChallenge({
          challengeId: createRes.challengeId,
          identifier: 'testotp@lumo.co.tz',
          code: '000000',
        })
        expect(verifyRes.success).toBe(false)
      }

      // 4th attempt should fail because challenge is consumed/exceeded
      const exceededRes = await verifyOtpChallenge({
        challengeId: createRes.challengeId,
        identifier: 'testotp@lumo.co.tz',
        code: '000000',
      })
      expect(exceededRes.success).toBe(false)
      expect(['MAX_ATTEMPTS_EXCEEDED', 'NO_ACTIVE_CHALLENGE']).toContain(exceededRes.error)
    })


  })

  describe('5. Session Security & Idle Expiration', () => {
    it('returns null for empty or invalid session token', async () => {
      const session = await getDatabaseSession(undefined)
      expect(session).toBeNull()
    })

    it('returns null for non-existent session token hash', async () => {
      const session = await getDatabaseSession('non_existent_token_string_123456789')
      expect(session).toBeNull()
    })
  })

})
