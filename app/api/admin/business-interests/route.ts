import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { providers } from '@/lib/providers'
import { recordSmsJob } from '@/modules/sms/store'
import {
  getMemoryLeads,
  findMemoryLeadById,
  updateMemoryLeadStatus,
} from '@/modules/business-interests/store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.trim().toLowerCase()
    const category = searchParams.get('category')

    let where: any = {}

    if (status && status !== 'ALL') {
      where.status = status
    }
    if (category && category !== 'ALL') {
      where.category = category
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    let dbLeads: any[] = []
    try {
      dbLeads = await (db as any).businessInterest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
    } catch (e) {
      console.warn('[Admin BusinessInterest] Prisma fetch error:', e)
    }

    if (dbLeads.length === 0) {
      dbLeads = getMemoryLeads()
      if (status && status !== 'ALL') {
        dbLeads = dbLeads.filter((l) => l.status === status)
      }
      if (category && category !== 'ALL') {
        dbLeads = dbLeads.filter((l) => l.category === category)
      }
      if (search) {
        dbLeads = dbLeads.filter(
          (l) =>
            l.businessName.toLowerCase().includes(search) ||
            l.contactName.toLowerCase().includes(search) ||
            l.email.toLowerCase().includes(search) ||
            l.phone.toLowerCase().includes(search)
        )
      }
    }

    // Standardize returned leads
    const leads = dbLeads.map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
    }))

    // Calculate status breakdown counts
    let allLeadsForCount: any[] = []
    try {
      allLeadsForCount = await (db as any).businessInterest.findMany({
        select: { status: true },
      })
    } catch {}

    if (allLeadsForCount.length === 0) {
      allLeadsForCount = getMemoryLeads()
    }

    const counts = {
      total: allLeadsForCount.length,
      new: allLeadsForCount.filter((l) => l.status === 'NEW').length,
      contacted: allLeadsForCount.filter((l) => l.status === 'CONTACTED').length,
      qualified: allLeadsForCount.filter((l) => l.status === 'QUALIFIED').length,
      onboarding: allLeadsForCount.filter((l) => l.status === 'ONBOARDING').length,
      verified: allLeadsForCount.filter((l) => l.status === 'VERIFIED').length,
      converted: allLeadsForCount.filter((l) => l.status === 'CONVERTED').length,
      not_interested: allLeadsForCount.filter((l) => l.status === 'NOT_INTERESTED').length,
    }

    return NextResponse.json({
      success: true,
      leads,
      counts,
    })
  } catch (error: any) {
    console.error('[Admin BusinessInterest] GET Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch business interest leads' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, adminNotes } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const validStatuses = [
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'ONBOARDING',
      'VERIFIED',
      'CONVERTED',
      'NOT_INTERESTED',
    ]

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    let existingLead: any = null
    try {
      existingLead = await (db as any).businessInterest.findUnique({
        where: { id },
      })
    } catch (e) {}

    if (!existingLead) {
      existingLead = findMemoryLeadById(id)
    }

    if (!existingLead) {
      return NextResponse.json(
        { success: false, error: 'Business interest lead not found' },
        { status: 404 }
      )
    }

    const previousStatus = existingLead.status

    const updateData: any = {}
    if (status) updateData.status = status
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes

    let updatedLead: any = null
    try {
      updatedLead = await (db as any).businessInterest.update({
        where: { id },
        data: updateData,
      })
    } catch (dbErr: any) {
      updatedLead = updateMemoryLeadStatus(id, status, adminNotes)
    }

    if (!updatedLead) {
      updatedLead = updateMemoryLeadStatus(id, status, adminNotes)
    }

    // AUTOMATED SMS DISPATCH ON APPROVAL (Transition to ONBOARDING, QUALIFIED, or VERIFIED)
    const isApprovalState = ['ONBOARDING', 'QUALIFIED', 'VERIFIED'].includes(status)
    const statusJustApproved = isApprovalState && previousStatus !== status
    let smsSent = false
    let smsDetails: any = null

    if (statusJustApproved && updatedLead.phone) {
      try {
        const onboardingUrl = 'https://lumo.co.tz/choose-path'
        const smsMessageText = `Hello ${updatedLead.contactName}, your business interest submission for ${updatedLead.businessName} has been approved by LUMO! Please start your guided onboarding here: ${onboardingUrl}`

        // Send via SMS provider (Beem/Meseji)
        const sendResult = await providers.sms.sendSms({
          recipientPhone: updatedLead.phone,
          messageText: smsMessageText,
          senderId: 'LUMO',
        })

        // Record SMS in audit store
        const recordedJob = recordSmsJob({
          recipientPhone: updatedLead.phone,
          messageText: smsMessageText,
          senderId: 'LUMO',
          channel: 'TRANSACTIONAL',
          status: sendResult.success ? 'SUBMITTED' : 'FAILED',
          templateCode: 'BUSINESS_LEAD_APPROVED',
          metadata: {
            leadId: updatedLead.id,
            businessName: updatedLead.businessName,
            status: status,
          },
        })

        smsSent = sendResult.success
        smsDetails = {
          jobId: recordedJob.id,
          message: smsMessageText,
          phone: updatedLead.phone,
          status: sendResult.success ? 'SENT' : 'FAILED',
        }
      } catch (smsErr) {
        console.warn('[Admin BusinessInterest] Auto-SMS dispatch error:', smsErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: statusJustApproved
        ? `Lead status updated to ${status}. Automated onboarding SMS dispatch triggered to ${updatedLead.phone}.`
        : `Lead status updated to ${status}.`,
      lead: updatedLead,
      sms: smsDetails,
    })
  } catch (error: any) {
    console.error('[Admin BusinessInterest] PATCH Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update lead' },
      { status: 500 }
    )
  }
}
