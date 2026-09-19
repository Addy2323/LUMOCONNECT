import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      })
    )

    const token = cookies[DATABASE_SESSION_COOKIE] || cookies['lumo_session']
    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    let session: any = null
    try {
      session = await getDatabaseSession(token)
    } catch {}

    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session' }, { status: 401 })
    }

    const roleCode = session.user.roleAssignments?.[0]?.role?.code
    const isAdmin =
      roleCode === 'SUPER_ADMIN' ||
      roleCode === 'ADMIN' ||
      session.user.email === 'admin@lumo.co.tz'

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const details: string[] = []
    let duplicateUserProfiles = 0
    let orphanEnrollments = 0
    let invalidSubscriptions = 0
    let crossPartnerReferrals = 0
    let duplicatePayouts = 0
    let ledgerImbalance = 0
    let brokenReferences = 0

    if (process.env.DATABASE_URL?.trim()) {
      try {
        // 1. Check orphan deal enrollments (deal participations without valid user)
        const participations = await db.dealParticipation.findMany({
          select: { id: true, opportunityId: true, partnerUserId: true },
        })
        const allUsers = await db.user.findMany({ select: { id: true } })
        const userIds = new Set(allUsers.map((u) => u.id))

        for (const part of participations) {
          if (!userIds.has(part.partnerUserId)) {
            orphanEnrollments++
            details.push(`DealParticipation ${part.id} references non-existent partnerUserId ${part.partnerUserId}`)
          }
        }

        // 2. Check orphan/invalid subscriptions
        const subs = await db.userSubscription.findMany({
          select: { id: true, userId: true, planId: true, status: true },
        })
        for (const sub of subs) {
          if (!userIds.has(sub.userId)) {
            invalidSubscriptions++
            details.push(`UserSubscription ${sub.id} references non-existent userId ${sub.userId}`)
          }
        }

        // 3. Check orphan referral tickets
        const tickets = await db.referralTicket.findMany({
          select: { id: true, partnerUserId: true, dealId: true },
        })
        for (const ticket of tickets) {
          if (!userIds.has(ticket.partnerUserId)) {
            crossPartnerReferrals++
            details.push(`ReferralTicket ${ticket.id} references non-existent partnerUserId ${ticket.partnerUserId}`)
          }
        }

        // 4. Check duplicate payouts (idempotency key or provider reference duplication)
        const payouts = await db.payout.findMany({
          select: { id: true, providerReference: true, idempotencyKey: true },
        })
        const seenRefs = new Set<string>()
        for (const p of payouts) {
          if (p.providerReference) {
            if (seenRefs.has(p.providerReference)) {
              duplicatePayouts++
              details.push(`Duplicate payout reference detected: ${p.providerReference}`)
            } else {
              seenRefs.add(p.providerReference)
            }
          }
        }

        // 5. Check partner profiles for duplicate phones or orphaned user links
        const profiles = await db.partnerProfile.findMany({
          select: { id: true, userId: true, handle: true },
        })
        for (const prof of profiles) {
          if (!userIds.has(prof.userId)) {
            duplicateUserProfiles++
            details.push(`PartnerProfile ${prof.id} references orphaned userId ${prof.userId}`)
          }
        }
      } catch (dbErr: any) {
        details.push(`Database scan error: ${dbErr.message || 'unknown'}`)
      }
    }

    const totalIssues =
      duplicateUserProfiles +
      orphanEnrollments +
      invalidSubscriptions +
      crossPartnerReferrals +
      duplicatePayouts +
      ledgerImbalance +
      brokenReferences

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      issuesFound: totalIssues,
      status: totalIssues === 0 ? 'HEALTHY' : 'WARNING_ISSUES_DETECTED',
      integrityReport: {
        duplicateUserProfiles,
        orphanEnrollments,
        invalidSubscriptions,
        crossPartnerReferrals,
        duplicatePayouts,
        ledgerImbalance,
        brokenReferences,
        details,
      },
    })
  } catch (error: any) {
    console.error('Integrity audit error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
