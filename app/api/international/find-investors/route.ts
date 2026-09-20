import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { InvestorType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.projectName || !body.capitalRequiredMinor) {
      return NextResponse.json(
        { success: false, error: 'Project name and capital required are mandatory.' },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const count = await prisma.investorProfile.count()
    const serial = String(count + 1).padStart(5, '0')
    const reference = `LUMO-INV-${year}-${serial}`

    let mappedInvestorType: InvestorType = 'INSTITUTIONAL'
    if (body.preferredInvestorType && Object.values(InvestorType).includes(body.preferredInvestorType as InvestorType)) {
      mappedInvestorType = body.preferredInvestorType as InvestorType
    }

    const record = await prisma.investorProfile.create({
      data: {
        entityName: body.projectName,
        investorType: mappedInvestorType,
        countryCode: body.countryCode || 'TZ',
        currency: body.currency || 'USD',
        minTicketMinor: BigInt(body.capitalRequiredMinor),
        maxTicketMinor: BigInt(body.capitalRequiredMinor),
        preferredSectors: body.sector ? [body.sector] : [],
        preferredCountries: [body.countryCode || 'TZ'],
      },
    })

    return NextResponse.json({
      success: true,
      reference,
      id: record.id,
      message: `Investor mandate reference ${reference} registered successfully.`,
    })
  } catch (error: any) {
    console.error('Find investors submission error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record investor request.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country')

    const profiles = await prisma.investorProfile.findMany({
      where: {
        ...(country ? { countryCode: country.toUpperCase() } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = profiles.map((p) => ({
      ...p,
      minTicketMinor: p.minTicketMinor ? Number(p.minTicketMinor) : 0,
      maxTicketMinor: p.maxTicketMinor ? Number(p.maxTicketMinor) : 0,
    }))

    return NextResponse.json({ success: true, profiles: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch investor mandates.' },
      { status: 500 }
    )
  }
}
