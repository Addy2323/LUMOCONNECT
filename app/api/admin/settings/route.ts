import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'

export async function GET() {
  try {
    const settings = {
      traWithholdingRateResidentPercent: 5.0,
      traWithholdingRateNonResidentPercent: 15.0,
      vatRatePercent: 18.0,
      attributionWindowDays: 30,
      privateMemberWindowHours: 24,
      minimumPayoutThresholdTZS: 10000,
      maintenanceMode: false,
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
    const actorId = session?.userId || 'usr_root_admin'

    const body = await request.json().catch(() => ({}))

    await db.auditLog.create({
      data: {
        actorUserId: actorId,
        action: 'ADMIN_SETTINGS_UPDATED',
        entityType: 'SETTINGS',
        entityId: 'global_system_settings',
        afterData: body,
      },
    })

    return NextResponse.json({ success: true, settings: body })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
