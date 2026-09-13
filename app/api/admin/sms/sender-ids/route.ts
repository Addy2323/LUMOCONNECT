import { NextRequest, NextResponse } from 'next/server'
import { getMesejiClient } from '@/lib/providers/meseji-client'
import { addSmsAuditLog } from '@/modules/sms/store'

export async function GET() {
  try {
    const client = getMesejiClient()
    const result = await client.getSenderIds()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve sender IDs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { name, sampleMessage, category = 'TRANSACTIONAL' } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Sender ID name is required.' }, { status: 400 })
    }

    const trimmedName = name.trim()
    if (trimmedName.length < 1 || trimmedName.length > 11) {
      return NextResponse.json(
        { error: 'Sender ID must be between 1 and 11 alphanumeric characters.' },
        { status: 400 }
      )
    }

    if (!sampleMessage || typeof sampleMessage !== 'string') {
      return NextResponse.json({ error: 'Sample message is required for TCRA regulatory review.' }, { status: 400 })
    }

    const wordCount = sampleMessage.trim().split(/\s+/).length
    if (wordCount < 10) {
      return NextResponse.json(
        { error: `Sample message must be at least 10 words for regulatory review (provided ${wordCount} words).` },
        { status: 400 }
      )
    }

    const client = getMesejiClient()
    const result = await client.requestSenderId({
      name: trimmedName,
      sampleMessage: sampleMessage.trim(),
      category,
    })

    addSmsAuditLog(
      'SENDER_ID_REQUESTED',
      'admin_console',
      { name: trimmedName, category, status: result.status || 'PENDING' }
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit Sender ID request' },
      { status: 500 }
    )
  }
}
