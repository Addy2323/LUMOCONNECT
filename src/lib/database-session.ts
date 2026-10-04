import { createHash } from 'crypto'
import { db } from '@/lib/db'

export const DATABASE_SESSION_COOKIE = 'lumo_db_session'
export const REFRESH_TOKEN_COOKIE = 'lumo_refresh_token'

export const sessionTokenHash = (token: string) => createHash('sha256').update(token).digest('hex')

const IDLE_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes for standard users
const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes for admin roles

export async function getDatabaseSession(token?: string) {
  if (!token) return null
  if (!process.env.DATABASE_URL?.trim()) return null

  try {
    const hashedToken = sessionTokenHash(token)
    const session = await db.session.findUnique({
      where: { token: hashedToken },
      include: {
        user: {
          include: {
            roleAssignments: {
              include: { role: true },
            },
          },
        },
      },
    })

    if (!session) return null

    // Check explicit revocation
    const sessionWithRevocation = session as typeof session & { revokedAt?: Date | null; lastActiveAt?: Date }
    if (sessionWithRevocation.revokedAt) return null

    // Check account status and soft-delete
    if (session.user.accountStatus !== 'ACTIVE' || session.user.deletedAt) return null

    // Check absolute expiration
    const now = new Date()
    if (session.expiresAt <= now) return null

    // Check role-based idle timeout
    const isAdmin = session.user.roleAssignments.some(
      (ra) => ra.role.code === 'ADMIN' || ra.role.code === 'SUPER_ADMIN'
    )
    const maxIdleMs = isAdmin ? ADMIN_IDLE_TIMEOUT_MS : IDLE_TIMEOUT_MS
    const lastActive = sessionWithRevocation.lastActiveAt || session.createdAt || now
    const idleMs = now.getTime() - lastActive.getTime()

    if (idleMs > maxIdleMs) {
      // Session expired due to inactivity — mark revoked
      await db.session.update({
        where: { id: session.id },
        data: { revokedAt: now } as any,
      }).catch(() => {})
      return null
    }

    // Update lastActiveAt periodically (if > 1 minute since last active update)
    if (idleMs > 60 * 1000) {
      await db.session.update({
        where: { id: session.id },
        data: { lastActiveAt: now } as any,
      }).catch(() => {})
    }

    return session
  } catch {
    return null
  }
}



/**
 * Revokes all sessions belonging to a specific user (e.g. on password reset/change)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) return
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  }).catch(() => {})
}

