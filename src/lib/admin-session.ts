import { NextRequest, NextResponse } from 'next/server'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from './database-session'

/** Database sessions only: client role headers and legacy demo tokens are never authority. */
export async function checkAdminSession(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
    const allowed = session.user.roleAssignments.some(assignment =>
      !assignment.organizationId && ['ADMIN', 'SUPER_ADMIN'].includes(assignment.role.code))
    if (!allowed) return NextResponse.json({ error: 'Platform administrator access required.' }, { status: 403 })
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.get('origin')
      if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== request.nextUrl.origin)) {
        return NextResponse.json({ error: 'Cross-origin mutation denied.' }, { status: 403 })
      }
    }
    return null
  } catch {
    return NextResponse.json({ error: 'Authentication service unavailable. Please retry.' }, { status: 503 })
  }
}
