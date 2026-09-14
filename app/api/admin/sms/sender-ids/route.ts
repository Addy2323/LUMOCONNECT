import { NextRequest, NextResponse } from 'next/server'
import { getActiveSmsProviderName } from '@/lib/providers'
import { getBeemClient } from '@/lib/providers/beem-client'
import { getMesejiClient } from '@/lib/providers/meseji-client'
import { addSmsAuditLog } from '@/modules/sms/store'

export async function GET() {
  try {
    const active = getActiveSmsProviderName()
    if (active === 'beem') {
      const client = getBeemClient()
      const result = await client.listSenderNames()
      return NextResponse.json({
        sender_ids: result.sender_names.map((s) => ({
          id: s.id,
          name: s.senderid,
          status: s.status,
          description: s.sample_content,
          created_at: s.created,
        })),
      })
    }

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

    const active = getActiveSmsProviderName()
    let result: { success: boolean; name?: string; status?: string; message?: string }

    if (active === 'beem') {
      // In Beem Africa, Sender IDs are provisioned via Beem dashboard or API setup
      result = {
        success: true,
        name: trimmedName,
        status: 'PENDING',
      }
    } else {
      const client = getMesejiClient()
      result = await client.requestSenderId({
        name: trimmedName,
        sampleMessage: sampleMessage.trim(),
        category,
      })
    }

    addSmsAuditLog(
      'REQUEST_SENDER_ID',
      'admin_console',
      { name: trimmedName, category, provider: active, status: result.status || 'PENDING' }
    )

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to request sender ID' },
      { status: 500 }
    )
  }
}
