import { describe, it, expect, beforeEach } from 'vitest'
import {
  normalizeCanonicalEmail,
  normalizeCanonicalPhone,
} from '@/modules/sms/phone'
import {
  registerInMemoryUser,
  findUserByEmail,
  findUserByPhone,
  deleteInMemoryUser,
} from '@/lib/userRegistry'

describe('Registration Security & Duplicate User Safeguards', () => {
  describe('Canonical Email & Phone Normalization', () => {
    it('normalizes emails cleanly to lowercased trimmed string', () => {
      expect(normalizeCanonicalEmail('  Test.User@Lumo.CO.TZ  ')).toBe('test.user@lumo.co.tz')
      expect(normalizeCanonicalEmail('')).toBeNull()
      expect(normalizeCanonicalEmail(null)).toBeNull()
      expect(normalizeCanonicalEmail(undefined)).toBeNull()
    })

    it('normalizes Tanzanian phone numbers from all formats to canonical E.164 (+255XXXXXXXXX)', () => {
      expect(normalizeCanonicalPhone('0712345678')).toBe('+255712345678')
      expect(normalizeCanonicalPhone('255712345678')).toBe('+255712345678')
      expect(normalizeCanonicalPhone('+255712345678')).toBe('+255712345678')
      expect(normalizeCanonicalPhone(' +255 712 345 678 ')).toBe('+255712345678')
      expect(normalizeCanonicalPhone('0688990011')).toBe('+255688990011')
    })

    it('converts empty or invalid phone values to null to avoid unique index collisions', () => {
      expect(normalizeCanonicalPhone('')).toBeNull()
      expect(normalizeCanonicalPhone('   ')).toBeNull()
      expect(normalizeCanonicalPhone(null)).toBeNull()
      expect(normalizeCanonicalPhone(undefined)).toBeNull()
    })
  })

  describe('Registration Uniqueness & Overwrite Protection', () => {
    const testEmail = 'sec_test_unique@lumo.co.tz'
    const testPhone = '+255799112233'

    beforeEach(() => {
      deleteInMemoryUser(testEmail)
    })

    it('allows initial valid registration', () => {
      const user = registerInMemoryUser({
        email: testEmail,
        password: 'Password123!',
        name: 'Initial User',
        phone: testPhone,
        role: 'PARTNER',
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe(testEmail)
      expect(user.phone).toBe(testPhone)
    })

    it('blocks repeated registration with same email and throws duplicate error instead of overwriting', () => {
      registerInMemoryUser({
        email: testEmail,
        password: 'Password123!',
        name: 'Initial User',
        phone: testPhone,
        role: 'PARTNER',
      })

      expect(() => {
        registerInMemoryUser({
          email: testEmail.toUpperCase(), // Case insensitive test
          password: 'HackedPassword999!',
          name: 'Attacker Name',
          phone: '+255799999999',
          role: 'PARTNER',
        })
      }).toThrow()

      // Verify initial user password/details were NOT overwritten by attacker
      const currentUser = findUserByEmail(testEmail)
      expect(currentUser?.name).toBe('Initial User')
    })

    it('blocks registration with same phone number under a different email address', () => {
      registerInMemoryUser({
        email: 'userA@lumo.co.tz',
        password: 'Password123!',
        name: 'User A',
        phone: testPhone,
        role: 'PARTNER',
      })

      expect(() => {
        registerInMemoryUser({
          email: 'userB@lumo.co.tz',
          password: 'Password123!',
          name: 'User B',
          phone: '0799112233', // Same phone in different format
          role: 'PARTNER',
        })
      }).toThrow()

      deleteInMemoryUser('userA@lumo.co.tz')
    })

    it('finds user by phone digits regardless of input format', () => {
      registerInMemoryUser({
        email: 'phone_find@lumo.co.tz',
        password: 'Password123!',
        name: 'Phone User',
        phone: '+255768112233',
        role: 'PARTNER',
      })

      const found = findUserByPhone('0768112233')
      expect(found).toBeDefined()
      expect(found?.email).toBe('phone_find@lumo.co.tz')

      deleteInMemoryUser('phone_find@lumo.co.tz')
    })
  })
})
