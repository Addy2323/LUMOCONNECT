import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { internationalService } from '@/modules/international/service'

export async function GET(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as any || undefined
    const search = searchParams.get('q') || undefined

    const submissions = await internationalService.listSubmissions({ status, search })
    const published = await internationalService.listPublishedOpportunities()
    const stats = await internationalService.getDynamicStats()
    const memberships = await internationalService.listMemberships()
    const inquiries = await internationalService.listInquiries()

    const allSubmissions = await internationalService.listSubmissions()
    const statusCounts = {
      all: allSubmissions.length,
      submitted: allSubmissions.filter((s) => s.status === 'SUBMITTED').length,
      under_review: allSubmissions.filter((s) => s.status === 'UNDER_REVIEW').length,
      contacting: allSubmissions.filter((s) => s.status === 'CONTACTING_SUBMITTER').length,
      info_required: allSubmissions.filter((s) => s.status === 'INFORMATION_REQUIRED').length,
      verified: allSubmissions.filter((s) => s.status === 'VERIFIED').length,
      approved: allSubmissions.filter((s) => s.status === 'APPROVED').length,
      published: allSubmissions.filter((s) => s.status === 'PUBLISHED').length,
      rejected: allSubmissions.filter((s) => s.status === 'REJECTED').length,
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      submissions,
      statusCounts,
      published,
      stats,
      memberships,
      inquiries,
      plans: internationalService.plans,
    })
  } catch (error: any) {
    console.error('Admin international API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch admin international data' },
      { status: 500 }
    )
  }
}
