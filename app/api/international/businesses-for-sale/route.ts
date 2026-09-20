import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.teaserTitle || !body.askingPriceMinor) {
      return NextResponse.json(
        { success: false, error: 'Title and asking valuation are required.' },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const count = await prisma.businessSaleListing.count()
    const serial = String(count + 1).padStart(5, '0')
    const reference = `LUMO-BIZ-${year}-${serial}`

    const listing = await prisma.businessSaleListing.create({
      data: {
        businessName: body.teaserTitle,
        isConfidential: true,
        countryCode: body.countryCode || 'TZ',
        sector: body.sector || 'HOSPITALITY',
        indicativeValuationMinor: BigInt(body.askingPriceMinor),
        currency: body.currency || 'USD',
        annualRevenueMinor: body.annualRevenueMinor ? BigInt(body.annualRevenueMinor) : null,
        ebitdaMinor: body.ebitdaMinor ? BigInt(body.ebitdaMinor) : null,
        reasonForSale: body.reasonForSale,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      reference,
      id: listing.id,
      message: `Business sale listing ${reference} created successfully.`,
    })
  } catch (error: any) {
    console.error('Business sale listing error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record business sale listing.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const listings = await prisma.businessSaleListing.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = listings.map((l) => ({
      ...l,
      indicativeValuationMinor: l.indicativeValuationMinor ? Number(l.indicativeValuationMinor) : 0,
      annualRevenueMinor: l.annualRevenueMinor ? Number(l.annualRevenueMinor) : null,
      ebitdaMinor: l.ebitdaMinor ? Number(l.ebitdaMinor) : null,
    }))

    return NextResponse.json({ success: true, listings: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch business sale listings.' },
      { status: 500 }
    )
  }
}
