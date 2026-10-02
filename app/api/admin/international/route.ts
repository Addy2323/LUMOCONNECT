import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { internationalService } from '@/modules/international/service'
import { prisma } from '@/lib/prisma'

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

    // Query Prisma database records for submitted International Desk forms
    const businessSales = await prisma.businessSaleListing.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const investorProfiles = await prisma.investorProfile.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const ndas = await prisma.nDA.findMany({
      include: {
        buyerUser: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const introductions = await prisma.internationalIntroduction.findMany({
      include: {
        opportunity: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const jvRequests = await prisma.jVRequest.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const formattedBusinessSales = businessSales.map((b) => ({
      ...b,
      indicativeValuationMinor: b.indicativeValuationMinor ? Number(b.indicativeValuationMinor) : 0,
      annualRevenueMinor: b.annualRevenueMinor ? Number(b.annualRevenueMinor) : null,
      ebitdaMinor: b.ebitdaMinor ? Number(b.ebitdaMinor) : null,
    }))

    const formattedInvestorProfiles = investorProfiles.map((i) => ({
      ...i,
      minTicketMinor: i.minTicketMinor ? Number(i.minTicketMinor) : 0,
      maxTicketMinor: i.maxTicketMinor ? Number(i.maxTicketMinor) : 0,
    }))

    const formattedIntroductions = introductions.map((i) => ({
      ...i,
      estimatedCapacityMinor: i.estimatedCapacityMinor ? Number(i.estimatedCapacityMinor) : 0,
    }))

    const formattedJvRequests = jvRequests.map((j) => ({
      ...j,
      capitalAvailableMinor: j.capitalAvailableMinor ? Number(j.capitalAvailableMinor) : 0,
    }))

    const allSubmissions = await internationalService.listSubmissions()
    const statusCounts = {
      all: allSubmissions.length + businessSales.length + investorProfiles.length + jvRequests.length + introductions.length,
      submitted: allSubmissions.filter((s) => s.status === 'SUBMITTED').length,
      under_review: allSubmissions.filter((s) => s.status === 'UNDER_REVIEW').length,
      contacting: allSubmissions.filter((s) => s.status === 'CONTACTING_SUBMITTER').length,
      info_required: allSubmissions.filter((s) => s.status === 'INFORMATION_REQUIRED').length,
      verified: allSubmissions.filter((s) => s.status === 'VERIFIED').length,
      approved: allSubmissions.filter((s) => s.status === 'APPROVED').length,
      published: allSubmissions.filter((s) => s.status === 'PUBLISHED').length,
      rejected: allSubmissions.filter((s) => s.status === 'REJECTED').length,
      businessSalesCount: businessSales.length,
      investorProfilesCount: investorProfiles.length,
      ndasCount: ndas.length,
      introductionsCount: introductions.length,
      jvRequestsCount: jvRequests.length,
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
      businessSales: formattedBusinessSales,
      investorProfiles: formattedInvestorProfiles,
      ndas,
      introductions: formattedIntroductions,
      jvRequests: formattedJvRequests,
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
