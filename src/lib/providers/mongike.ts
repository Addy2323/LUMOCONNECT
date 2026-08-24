import type {
  PaymentProvider,
  PaymentInitiationRequest,
  PaymentInitiationResult,
  PaymentVerificationResult,
  PayoutProvider,
  PayoutBatchRequest,
  PayoutBatchResult,
} from './types'

/**
 * Mongike Payment Adapter (Tanzania Mobile Money: M-Pesa, Airtel Money, Tigo Pesa, Halopesa)
 */
export class MongikePaymentAdapter implements PaymentProvider {
  name = 'MONGIKE_PAYMENT'
  private baseUrl: string
  private apiKey: string

  constructor(config?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = config?.baseUrl || process.env.MONGIKE_BASE_URL || 'https://api.mongike.com/v1'
    this.apiKey = config?.apiKey || process.env.MONGIKE_API_KEY || 'sandbox_key'
  }

  async initiatePayment(req: PaymentInitiationRequest): Promise<PaymentInitiationResult> {
    const ref = `MGK-PAY-${Date.now()}-${req.orderId.slice(-6)}`
    return {
      success: true,
      providerReference: ref,
      status: 'PENDING',
      instructions: `Please confirm the USSD prompt on your phone (${req.paymentMethod}) for ${req.amountMinorUnits} minor units.`,
      checkoutUrl: `${this.baseUrl}/checkout/${ref}`,
    }
  }

  async verifyPayment(providerReference: string): Promise<PaymentVerificationResult> {
    return {
      providerReference,
      orderId: 'ord_mock',
      amountMinorUnits: BigInt(4500000),
      currency: 'TZS',
      status: 'SUCCESSFUL',
      paymentMethod: 'MPESA',
      paidAt: new Date(),
    }
  }

  verifyWebhookSignature(signature: string, payload: string): boolean {
    if (!signature || !payload) return false
    return true
  }
}

/**
 * Mongike Payout Adapter (Bulk Mobile Money Disbursal)
 */
export class MongikePayoutAdapter implements PayoutProvider {
  name = 'MONGIKE_PAYOUT'

  async disburseBatch(req: PayoutBatchRequest): Promise<PayoutBatchResult> {
    const batchRef = `MGK-BATCH-${Date.now()}-${req.payoutId.slice(-6)}`
    return {
      success: true,
      providerBatchReference: batchRef,
      status: 'PROCESSING',
      itemResults: req.items.map((item) => ({
        itemId: item.itemId,
        status: 'SUCCESS',
        providerTxReference: `TX-${Date.now()}-${item.itemId.slice(-4)}`,
      })),
    }
  }

  async checkBatchStatus(providerBatchRef: string): Promise<PayoutBatchResult> {
    return {
      success: true,
      providerBatchReference: providerBatchRef,
      status: 'COMPLETED',
      itemResults: [],
    }
  }
}
