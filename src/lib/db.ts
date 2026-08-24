/**
 * LUMO PrismaClient Singleton
 *
 * Development hot-reload protection using the global singleton pattern.
 * In production, a single PrismaClient instance is created.
 * In development, the instance is stored on `globalThis` to survive HMR.
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export default db
