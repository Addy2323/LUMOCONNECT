import { scryptSync, timingSafeEqual } from 'crypto'
import { db } from '../src/lib/db'

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [hash, salt] = storedHash.split(':')
    if (!hash || !salt) return false
    const hashBuffer = Buffer.from(hash, 'hex')
    const testHash = scryptSync(password, salt, 64)
    return timingSafeEqual(hashBuffer, testHash)
  } catch {
    return false
  }
}

async function testLogin(email: string, pass: string) {
  const user = await db.user.findUnique({
    where: { email },
    include: { accounts: true },
  })

  if (!user) {
    console.log(`User ${email} NOT FOUND`)
    return
  }

  const cred = user.accounts.find((a) => a.providerId === 'credential')
  if (!cred?.password) {
    console.log(`No password set for ${email}`)
    return
  }

  const valid = verifyPassword(pass, cred.password)
  console.log(`Testing login for ${email} with password "${pass}": Valid = ${valid}`)
}

async function run() {
  await testLogin('wefezyzype@mailinator.com', '12345678')
  await testLogin('vaxu@mailinator.com', '12345678')
  await testLogin('vaxuf@mailinator.com', '12345678')
}

run()
  .catch(console.error)
  .finally(() => process.exit(0))
