import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { internationalService } from '@/modules/international/service'
import { InternationalPlanCode } from '@/modules/international/types'

export async function GET(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied

  try {
    const memberships = await internationalService.listMemberships()
    return NextResponse.json({
      success: true,
      memberships,
      plans: internationalService.plans,
    })
  } catch (error: any) {
    console.error('Admin list international subscriptions error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list international subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied

  try {
    const body = await request.json()
    const { action, id, payload, grantData, adminName = 'Super Admin' } = body

    if (action === 'GRANT' && grantData) {
      const { userId, userName, userEmail, userPhone, planCode, currency, amountPaid, notes } = grantData
      if (!userId || !userEmail || !planCode) {
        return NextResponse.json(
          { success: false, error: 'User ID, email, and plan code are required' },
          { status: 400 }
        )
      }

      const membership = await internationalService.createOrUpdateMembership({
        userId,
        userName: userName || userEmail.split('@')[0],
        userEmail,
        userPhone,
        planCode: planCode as InternationalPlanCode,
        currency: (currency || 'USD').toUpperCase(),
        amountPaid: Number(amountPaid) || 0,
        paymentMethod: 'ADMIN_MANUAL_GRANT',
        paymentReference: `ADM-GRANT-${Date.now().toString().slice(-6)}`,
        grantedByAdmin: adminName,
        notes: notes || `Direct manual grant by ${adminName}`,
      })

      return NextResponse.json({
        success: true,
        membership,
        message: `International Private Access granted to ${userEmail} successfully.`,
      })
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Membership ID required' }, { status: 400 })
    }

    if (['EXTEND', 'CANCEL', 'SUSPEND', 'ACTIVATE', 'CHANGE_PLAN'].includes(action)) {
      const updated = await internationalService.updateMembershipAdmin(id, action, payload)
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Membership not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, membership: updated, message: `Membership ${action.toLowerCase()}ed successfully.` })
    }

    return NextResponse.json({ success: false, error: 'Invalid subscription management action' }, { status: 400 })
  } catch (error: any) {
    console.error('Admin manage international subscriptions error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error managing international subscription' },
      { status: 500 }
    )
  }
}
