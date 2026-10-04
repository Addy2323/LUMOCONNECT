import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMesejiClient } from '@/src/lib/providers/meseji-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.teaserTitle || !body.askingPriceMinor || !body.phone || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Teaser title, asking valuation, phone number, and email address are required.' },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const count = await prisma.businessSaleListing.count()
    const serial = String(count + 1).padStart(5, '0')
    const reference = `LUMO-BIZ-${year}-${serial}`

    const contactHeader = `[Seller: ${body.fullName || 'N/A'} | Phone: ${body.phone} | Email: ${body.email}]`
    const updatedReasonForSale = `${contactHeader}\nReason for Sale: ${body.reasonForSale || 'N/A'}`

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
        reasonForSale: updatedReasonForSale,
        status: 'ACTIVE',
      },
    })

    // Instant Meseji SMS Alert to Admin 0768828247 (255768828247)
    try {
      const meseji = getMesejiClient()
      const adminPhone = '255768828247'
      const smsMessage = `LUMO ALERT: New Business Sale Listing (${reference}) submitted by ${body.fullName || 'Seller'} (${body.phone} / ${body.email}). Title: "${body.teaserTitle}". Valuation: ${body.currency || 'USD'} ${(body.askingPriceMinor / 100).toLocaleString()}. Log in to review.`
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
