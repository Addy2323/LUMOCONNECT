import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recordMemoryLead } from '@/modules/business-interests/store'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      submittingAs,
      businessName,
      contactName,
      phone,
      email,
      category,
      interests,
      description,
      website,
      location,
      socialMedia,
    } = body

    // Validation
    if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Business / Entity Name is required' },
        { status: 400 }
      )
    }

    if (!contactName || typeof contactName !== 'string' || !contactName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Contact Name is required' },
        { status: 400 }
      )
    }

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      )
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { success: false, error: 'Business Category is required' },
        { status: 400 }
      )
    }

    // Normalize interests to string array
    let normalizedInterests: string[] = []
    if (Array.isArray(interests)) {
      normalizedInterests = interests.map((i) => String(i).trim()).filter(Boolean)
    } else if (typeof interests === 'string' && interests.trim()) {
      normalizedInterests = interests.split(',').map((i) => i.trim()).filter(Boolean)
    }

    if (normalizedInterests.length === 0) {
      normalizedInterests = ['General Business Interest']
    }

    const finalDescription = submittingAs
      ? `[Submitting As: ${submittingAs}] ${description ? String(description).trim() : ''}`.trim()
      : description
      ? String(description).trim()
      : null

    let createdLead: any = null

    try {
      createdLead = await (db as any).businessInterest.create({
        data: {
          businessName: businessName.trim(),
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          category: category.trim(),
          interests: normalizedInterests,
          description: finalDescription,
          website: website ? String(website).trim() : null,
          location: location ? String(location).trim() : null,
          socialMedia: socialMedia ? String(socialMedia).trim() : null,
          status: 'NEW',
        },
      })
    } catch (dbErr) {
      console.warn('[BusinessInterest] DB store fallback:', dbErr)
      createdLead = recordMemoryLead({
        businessName: businessName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        category: category.trim(),
        interests: normalizedInterests,
        description: finalDescription,
        website: website ? String(website).trim() : null,
        location: location ? String(location).trim() : null,
        socialMedia: socialMedia ? String(socialMedia).trim() : null,
        status: 'NEW',
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Business interest lead submitted successfully.',
        lead: createdLead,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[BusinessInterest] Submit error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit business interest' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    categories: [
      'Sports & Fitness',
      'Travel & Tourism',
      'Technology & Software',
      'Retail & E-commerce',
      'Hospitality & Dining',
      'Energy & Solar',
      'Real Estate & Housing',
      'Professional Services',
      'Healthcare & Wellness',
      'Manufacturing & Agriculture',
      'Other',
    ],
    interestOptions: [
      'Sell Products',
      'Find Customers',
      'Partner Opportunities',
      'Advertising',
      'International Opportunities',
    ],
  })
}
