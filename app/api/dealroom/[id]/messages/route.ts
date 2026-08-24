import { NextResponse, type NextRequest } from 'next/server'
import { getDealRoom, postDealRoomMessage } from '@/modules/dealroom/service'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = await requireAuth(request)
    const room = getDealRoom(id)

    if (!room) {
      return NextResponse.json({ success: false, error: 'Deal room not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      dealRoomId: room.id,
      messages: room.messages,
      deliverables: room.deliverables,
      status: room.status,
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 500
    const message = error instanceof Error ? error.message : 'Failed to fetch deal room messages'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const auth = await requireAuth(request)
    const body = (await request.json()) as {
      message: string
      attachmentUrl?: string
    }

    if (!body.message?.trim()) {
      return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 })
    }

    const senderRole = auth.roles.some((r) => r.role === 'BUSINESS_OWNER' || r.role === 'BUSINESS_STAFF')
      ? 'BUSINESS'
      : auth.roles.some((r) => r.role === 'ADMIN' || r.role === 'SUPER_ADMIN')
      ? 'LUMO_FACILITATOR'
      : 'PARTNER'

    const senderName = auth.email.split('@')[0]

    const msg = postDealRoomMessage({
      dealRoomId: id,
      senderId: auth.userId,
      senderName,
      senderRole,
      message: body.message,
      attachmentUrl: body.attachmentUrl,
    })

    return NextResponse.json({ success: true, message: 'Message posted', data: msg }, { status: 201 })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Failed to post message'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
