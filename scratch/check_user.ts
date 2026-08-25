import { db } from '../src/lib/db'

async function checkUser() {
  const users = await db.user.findMany({
    where: {
      email: {
        contains: 'mailinator.com',
      },
    },
    include: {
      accounts: true,
    },
  })

  console.log('Found users:', JSON.stringify(users, null, 2))
}

checkUser()
  .catch(console.error)
  .finally(() => process.exit(0))
