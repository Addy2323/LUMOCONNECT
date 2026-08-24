import { NextResponse, type NextRequest } from 'next/server'
import { processOutboxQueue, getOutboxEvents } from '@/lib/outbox'
import '@/modules/notifications/worker' // Ensure notification worker handlers are registered

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const result = await processOutboxQueue(limit)
    const pendingEvents = getOutboxEvents({ status: 'PENDING' })

    return NextResponse.json({
      success: true,
      summary: result,
      pendingCount: pendingEvents.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Outbox processing failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const events = getOutboxEvents()
    return NextResponse.json({
      success: true,
      total: events.length,
      data: events,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch outbox events'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
