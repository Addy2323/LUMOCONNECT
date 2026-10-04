import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMesejiClient } from '@/src/lib/providers/meseji-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.investorEntityName || !body.estimatedBudgetMinor || !body.whatsAppNumber || !body.emailAddress) {
      return NextResponse.json(
        { success: false, error: 'Investor entity name, budget, phone/WhatsApp number, and email address are required.' },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const count = await prisma.internationalIntroduction.count()
    const serial = String(count + 1).padStart(5, '0')
    const reference = `LUMO-INTRO-${year}-${serial}`

    const intro = await prisma.internationalIntroduction.create({
      data: {
        introductionNumber: reference,
        originatingPartnerId: body.partnerUserId || null,
        opportunityId: body.opportunityId || null,
        investorLeadName: body.investorEntityName,
        investorCountry: body.countryCode || 'AE',
        investorType: body.investorType || 'FAMILY_OFFICE',
        estimatedCapacityMinor: BigInt(body.estimatedBudgetMinor),
        currency: body.currency || 'USD',
        contactPerson: body.contactName || null,
        whatsAppNumber: body.whatsAppNumber,
        emailAddress: body.emailAddress,
        notes: body.mandateNotes || null,
        stage: 'LEAD_SUBMITTED',
      },
    })

    // Instant Meseji SMS Alert to Admin 0768828247 (255768828247)
    try {
      const meseji = getMesejiClient()
      const adminPhone = '255768828247'
      const smsMessage = `LUMO ALERT: New Investor Introduction Pipeline (${reference}) submitted by ${body.contactName || 'Partner'} (${body.whatsAppNumber} / ${body.emailAddress}). Investor: "${body.investorEntityName}". Capacity: ${body.currency || 'USD'} ${(body.estimatedBudgetMinor / 100).toLocaleString()}. Log in to review.`
      await meseji.sendSms({
        recipientPhone: adminPhone,
        messageText: smsMessage,
      })
    } catch (smsErr) {
      console.error('Failed to dispatch admin SMS alert:', smsErr)
    }

    return NextResponse.json({
      success: true,
      reference,
      id: intro.id,
      message: `Introduction referral ${reference} registered successfully.`,
    })
  } catch (error: any) {
    console.error('Introduction registration error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record introduction referral.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerUserId = searchParams.get('partnerUserId')

    const intros = await prisma.internationalIntroduction.findMany({
      where: {
        ...(partnerUserId ? { originatingPartnerId: partnerUserId } : {}),
      },
      include: {
        opportunity: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = intros.map((i) => ({
      ...i,
      estimatedCapacityMinor: i.estimatedCapacityMinor ? Number(i.estimatedCapacityMinor) : 0,
    }))

    return NextResponse.json({ success: true, introductions: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch introductions.' },
      { status: 500 }
    )
  }
}
