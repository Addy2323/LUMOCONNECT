import { db } from '../src/lib/db'
import crypto from 'crypto'

async function updateLegacyPasswords() {
  const salt = crypto.randomBytes(16).toString('hex')
  const hashedPassword = crypto.scryptSync('12345678', salt, 64).toString('hex') + ':' + salt

  const updated = await db.account.updateMany({
    where: {
      providerId: 'credential',
      OR: [
        { password: 'no_password_set' },
        { password: null },
        { password: '' },
      ],
    },
    data: {
      password: hashedPassword,
    },
  })

  console.log(`Updated ${updated.count} accounts with password '12345678'.`)
}

updateLegacyPasswords()
  .catch(console.error)
  .finally(() => process.exit(0))
