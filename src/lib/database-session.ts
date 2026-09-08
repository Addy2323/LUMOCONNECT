import { createHash } from 'crypto'
import { db } from '@/lib/db'

export const DATABASE_SESSION_COOKIE = 'lumo_db_session'
export const sessionTokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

export async function getDatabaseSession(token?: string) {
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token: sessionTokenHash(token) },
    include: { user: { include: { roleAssignments: { include: { role: true } } } } },
  })
  if (!session || session.expiresAt <= new Date() || session.user.accountStatus !== 'ACTIVE' || session.user.deletedAt) return null
  return session
}
