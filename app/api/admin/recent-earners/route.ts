import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'
import { isValidRequestOrigin } from '@/lib/origin'
import { earningsConfigSchema } from '@/lib/public-earnings'

async function authorized(request: NextRequest) {
  const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
  return session?.user.roleAssignments.some(assignment => ['ADMIN', 'SUPER_ADMIN'].includes(assignment.role.code))
}
export async function GET(request: NextRequest) {
  if (!await authorized(request)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  return Response.json(earningsConfigSchema.parse(await db.publicEarningsConfig.findUnique({ where: { id: 'global' } }) ?? {}))
}
export async function PUT(request: NextRequest) {
  if (!isValidRequestOrigin(request)) return Response.json({ error: 'Invalid origin' }, { status: 403 })
  if (!await authorized(request)) return Response.json({ error: 'Forbidden' }, { status: 403 })
  const parsed = earningsConfigSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: 'Invalid configuration' }, { status: 400 })
  const config = await db.publicEarningsConfig.upsert({ where: { id: 'global' }, create: { id: 'global', ...parsed.data }, update: parsed.data })
  return Response.json(earningsConfigSchema.parse(config))
}
