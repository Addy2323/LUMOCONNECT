import { NextResponse, type NextRequest } from 'next/server'
import { createCustomerOrder, listOrdersForCustomer, listOrdersForMerchant } from '@/modules/orders/service'
import type { CreateOrderInput } from '@/modules/orders/types'
import { getAuthContext } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const orgId = searchParams.get('organizationId')

    if (phone) {
      const customerOrders = listOrdersForCustomer(phone)
      return NextResponse.json({ success: true, total: customerOrders.length, data: customerOrders })
    }

    if (orgId) {
      const merchantOrders = listOrdersForMerchant(orgId)
      return NextResponse.json({ success: true, total: merchantOrders.length, data: merchantOrders })
    }

    const auth = await getAuthContext(request)
    if (auth?.organizationId) {
      const merchantOrders = listOrdersForMerchant(auth.organizationId)
      return NextResponse.json({ success: true, total: merchantOrders.length, data: merchantOrders })
    }

    return NextResponse.json({ success: true, total: 0, data: [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

/**
 * Customer Order Creation Endpoint:
 * Accessible to public customers without requiring a partner subscription or account.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOrderInput

    if (!body.opportunityId || !body.customerName || !body.customerPhone || !body.deliveryAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required order fields: opportunityId, customerName, customerPhone, deliveryAddress',
        },
        { status: 400 }
      )
    }

    const order = createCustomerOrder(body)

    return NextResponse.json(
      {
        success: true,
        message: 'Order created and payment authorized. Merchant has been notified for dispatch.',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmountMinor: order.totalAmountMinor.toString(),
          paymentProviderRef: order.paymentProviderRef,
          customerPhone: order.customerPhone,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Order placement failed'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
