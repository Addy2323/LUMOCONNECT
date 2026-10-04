import { NextRequest, NextResponse } from 'next/server'
import { internationalService } from '@/modules/international/service'
import { getCountryByCode } from '@/modules/international/countries'
import { getMesejiClient } from '@/src/lib/providers/meseji-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.fullName || !body.title || !body.description || !body.whatsapp || !body.email || !body.countryCode) {
      return NextResponse.json(
        { success: false, error: 'Please provide full name, opportunity title, description, country, WhatsApp phone, and email.' },
        { status: 400 }
      )
    }

    const country = getCountryByCode(body.countryCode)
    const countryName = country?.name || body.countryName || body.countryCode

    const submission = await internationalService.createSubmission({
      submitterType: body.submitterType || 'INDIVIDUAL',
      fullName: String(body.fullName).trim(),
      organization: body.organization ? String(body.organization).trim() : undefined,
      countryCode: String(body.countryCode).toUpperCase(),
      countryName,
      city: body.city ? String(body.city).trim() : undefined,
      category: body.category || 'BUSINESS_OPPORTUNITY',
      intent: body.intent || 'OFFERING',
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      declaredValue: Number(body.declaredValue) || 0,
      currency: (body.currency || country?.currency || 'USD').toUpperCase(),
      whatNeededFromLumo: body.whatNeededFromLumo ? String(body.whatNeededFromLumo).trim() : undefined,
      whatsapp: String(body.whatsapp).trim(),
      email: String(body.email).trim().toLowerCase(),
      preferredContact: body.preferredContact || 'WHATSAPP',
      website: body.website ? String(body.website).trim() : undefined,
      documents: Array.isArray(body.documents) ? body.documents : [],
    })

    // Instant SMS Notification to Admin via Meseji (0768828247 -> 255768828247)
    try {
      const meseji = getMesejiClient()
      const smsMessage = `LUMO ALERT: New International Deal submitted by ${submission.fullName} (${submission.whatsapp} / ${submission.email}). Title: ${submission.title}. Ref: ${submission.reference}. Log in to Admin Desk to review.`
      await meseji.sendSms({
        recipientPhone: '255768828247',
        messageText: smsMessage,
      })
    } catch (smsErr) {
      console.error('Failed to dispatch Meseji SMS alert to Admin:', smsErr)
    }

    const { text, url } = internationalService.buildWhatsAppMessage(submission)

    return NextResponse.json({
      success: true,
      reference: submission.reference,
      submission,
      whatsApp: {
        template: text,
        url,
      },
      message: `Your international opportunity reference is ${submission.reference}. LUMO Admin has received your submission and will review it.`,
    })
  } catch (error: any) {
    console.error('International submission error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit international opportunity.' },
      { status: 500 }
    )
  }
}

