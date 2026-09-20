import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.investorEntityName || !body.estimatedBudgetMinor) {
      return NextResponse.json(
        { success: false, error: 'Investor entity name and budget are required.' },
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
        notes: body.mandateNotes || null,
        stage: 'LEAD_SUBMITTED',
      },
    })

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
