import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.companyName || !body.targetProject) {
      return NextResponse.json(
        { success: false, error: 'Company name and target project details are required.' },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const count = await prisma.jVRequest.count()
    const serial = String(count + 1).padStart(5, '0')
    const reference = `LUMO-JV-${year}-${serial}`

    const jvRequest = await prisma.jVRequest.create({
      data: {
        companyName: body.companyName,
        countryCode: body.countryCode || 'AE',
        sector: body.sector || 'GENERAL',
        whatWeBring: Array.isArray(body.whatWeBring) ? body.whatWeBring : [],
        capitalAvailableMinor: body.capitalAvailableMinor ? BigInt(body.capitalAvailableMinor) : 0n,
        currency: body.currency || 'USD',
        partnerCountryRequired: body.partnerCountryRequired || 'TZ',
        partnerType: body.partnerType || 'LOCAL_OPERATOR',
        partnerShouldProvide: Array.isArray(body.partnerShouldProvide) ? body.partnerShouldProvide : [],
        targetProject: body.targetProject,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      reference,
      id: jvRequest.id,
      message: `JV Request reference ${reference} registered successfully.`,
    })
  } catch (error: any) {
    console.error('JV Request error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record JV request.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const requests = await prisma.jVRequest.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = requests.map((r) => ({
      ...r,
      capitalAvailableMinor: r.capitalAvailableMinor ? Number(r.capitalAvailableMinor) : 0,
    }))

    return NextResponse.json({ success: true, requests: formatted })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch JV requests.' },
      { status: 500 }
    )
  }
}
