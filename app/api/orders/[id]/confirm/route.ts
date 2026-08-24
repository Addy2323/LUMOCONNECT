import { NextResponse, type NextRequest } from 'next/server'
import {
  merchantDispatchOrder,
  merchantConfirmDelivered,
  completeOrderSettlement,
  getOrderById,
} from '@/modules/orders/service'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json()) as {
      action: 'MERCHANT_DISPATCH' | 'MERCHANT_DELIVER' | 'CUSTOMER_ACCEPT' | 'AUTO_RELEASE'
      trackingNumber?: string
      carrierName?: string
      signedDeliveryNoteUrl?: string
      ownershipDocUrl?: string
    }

    const order = getOrderById(id)
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    let updatedOrder = order

    switch (body.action) {
      case 'MERCHANT_DISPATCH':
        if (!body.trackingNumber) {
          return NextResponse.json({ success: false, error: 'trackingNumber is required for dispatch' }, { status: 400 })
        }
        updatedOrder = merchantDispatchOrder({
          orderId: id,
          trackingNumber: body.trackingNumber,
          carrierName: body.carrierName,
        })
        break

      case 'MERCHANT_DELIVER':
        if (!body.signedDeliveryNoteUrl) {
          return NextResponse.json({ success: false, error: 'signedDeliveryNoteUrl is required for delivery proof' }, { status: 400 })
        }
        updatedOrder = merchantConfirmDelivered({
          orderId: id,
          signedDeliveryNoteUrl: body.signedDeliveryNoteUrl,
          ownershipDocUrl: body.ownershipDocUrl,
        })
        break

      case 'CUSTOMER_ACCEPT':
        updatedOrder = completeOrderSettlement({
          orderId: id,
          completedBy: 'CUSTOMER',
        })
        break

      case 'AUTO_RELEASE':
        updatedOrder = completeOrderSettlement({
          orderId: id,
          completedBy: 'AUTO_RELEASE_TIMER',
        })
        break

      default:
        return NextResponse.json({ success: false, error: 'Invalid confirmation action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Order ${updatedOrder.orderNumber} successfully transitioned to ${updatedOrder.status}`,
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        confirmations: updatedOrder.confirmations,
        inspectionWindowExpiresAt: updatedOrder.inspectionWindowExpiresAt,
      },
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Order confirmation failed'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
