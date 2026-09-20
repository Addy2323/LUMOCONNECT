import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.signerFullName || !body.signerEmail) {
      return NextResponse.json(
        { success: false, error: 'Signer full name and email are mandatory for NDA execution.' },
        { status: 400 }
      )
    }

    const year = new Date().getFullYear()
    const count = await prisma.nDA.count()
    const serial = String(count + 1).padStart(5, '0')
    const reference = `LUMO-NDA-${year}-${serial}`

    // Ensure we have a valid buyer user ID or fallback user ID
    let buyerUserId = body.signerUserId
    if (!buyerUserId) {
      const firstUser = await prisma.user.findFirst()
      if (firstUser) buyerUserId = firstUser.id
    }

    if (!buyerUserId) {
      return NextResponse.json(
        { success: false, error: 'A registered user account is required to execute an NDA.' },
        { status: 400 }
      )
    }

    const nda = await prisma.nDA.create({
      data: {
        opportunityId: body.opportunityId || null,
        businessSaleListingId: body.businessSaleListingId || null,
        buyerUserId: buyerUserId,
        signedAt: new Date(),
        status: 'SIGNED',
      },
    })

    return NextResponse.json({
      success: true,
      reference,
      id: nda.id,
      message: `NDA ${reference} executed successfully. Data room authorization granted.`,
    })
  } catch (error: any) {
    console.error('NDA execution error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute NDA agreement.' },
      { status: 500 }
    )
  }
}
