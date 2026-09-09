import { NextRequest, NextResponse } from 'next/server'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'
import { DealAccessError } from './policy'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

export async function actor(request: NextRequest) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) throw new DealAccessError('Invalid request origin.')
  }
  const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
  if (!session) throw new DealAccessError('Sign in with an active account.', 401)
  return session.user
}
export type Actor = Awaited<ReturnType<typeof actor>>
export function requireAdmin(user: Actor) {
  if (!user.roleAssignments.some(a => !a.organizationId && ['ADMIN', 'SUPER_ADMIN', 'COMPLIANCE'].includes(a.role.code)))
    throw new DealAccessError('Administrator or compliance access is required.')
}
export function json(value: unknown, status = 200) {
  return new NextResponse(JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v), {
    status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  })
}
export function failure(error: unknown) {
  if (error instanceof DealAccessError) return json({ error: error.message }, error.status)
  if (error instanceof ZodError || error instanceof SyntaxError) return json({ error: 'Invalid request. Check the supplied fields.' }, 400)
  if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2002', 'P2034'].includes(error.code))
    return json({ error: 'This request conflicts with an existing record. Refresh and try again.' }, 409)
  console.error('Hot deals operation failed', error instanceof Error ? error.name : 'Unknown error')
  return json({ error: 'Hot deals are temporarily unavailable. Please try again.' }, 503)
}
