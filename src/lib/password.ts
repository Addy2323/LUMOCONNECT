import { scryptSync, timingSafeEqual, randomBytes } from 'crypto'

const DUMMY_HASH = '0000000000000000000000000000000000000000000000000000000000000000:00000000000000000000000000000000'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${hash}:${salt}`
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) {
    // Constant-time execution against dummy hash to mitigate timing side-channel attack
    verifyPassword(password, DUMMY_HASH)
    return false
  }

  try {
    const [hash, salt] = storedHash.split(':')
    if (!hash || !salt) {
      verifyPassword(password, DUMMY_HASH)
      return false
    }
    const hashBuffer = Buffer.from(hash, 'hex')
    const testHash = scryptSync(password, salt, 64)
    if (hashBuffer.length !== testHash.length) return false
    return timingSafeEqual(hashBuffer, testHash)
  } catch {
    return false
  }
}
