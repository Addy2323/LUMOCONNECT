import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, sessionTokenHash } from '@/lib/database-session'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(DATABASE_SESSION_COOKIE)?.value
  if (token) await db.session.deleteMany({ where: { token: sessionTokenHash(token) } })
  const response = NextResponse.json({ success: true })
  response.cookies.set(DATABASE_SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
  return response
}
