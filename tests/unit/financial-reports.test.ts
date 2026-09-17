import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/admin-session', () => ({
  checkAdminSession: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/modules/payouts/payout-store', () => ({
  listAllPayoutRequests: vi.fn().mockResolvedValue([
    {
      id: 'payout-1',
      reference: 'POUT-2026-001',
      partnerName: 'Given Mhema',
      accountNumber: '255755123456',
      payoutChannel: 'MPESA',
      grossAmountTZS: 100000,
      netAmountTZS: 90000,
      platformFeeTZS: 5000,
      taxWithheldTZS: 5000,
      status: 'PAID',
      authorizedBy: 'Super Admin',
      disbursalReference: 'DISB-001',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
}))

vi.mock('@/lib/db', () => ({
  db: {
    paymentAttempt: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'pay-1',
          amountMinor: 25000000, // 250,000 TZS
          purpose: 'SUBSCRIPTION',
          status: 'SUCCESSFUL',
          providerReference: 'SNIPPE-SUB-01',
          paymentMethod: 'AIRTEL_MONEY',
          createdAt: new Date(),
          user: { name: 'Super Partner VIP' },
        },
        {
          id: 'pay-2',
          amountMinor: 100000000, // 1,000,000 TZS
          purpose: 'ORDER_PAYMENT',
          status: 'SUCCESSFUL',
          providerReference: 'SNIPPE-ORD-02',
          paymentMethod: 'MPESA',
          createdAt: new Date(),
          user: { name: 'Client Buyer Corp' },
        },
      ]),
    },
    payout: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'payout-1',
          reference: 'POUT-2026-001',
          partnerName: 'Given Mhema',
          accountNumber: '255755123456',
          payoutChannel: 'MPESA',
          grossAmountTZS: 100000,
          netAmountTZS: 90000,
          platformFeeTZS: 5000,
          taxWithheldTZS: 5000,
          status: 'PAID',
          authorizedBy: 'Super Admin',
          disbursalReference: 'DISB-001',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    },
    referralTicket: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'ticket-1',
          ticketReference: 'LUMO-TICK-001',
          dealTitle: 'Heavy Equipment Supply Flow',
          partnerName: 'Given Mhema',
          customerFirstName: 'Rashid',
          customerLastName: 'Ally',
          merchantName: 'Swiss Trade Flow',
          rewardAmountTZS: 75000,
          stage: 'SUCCESSFUL',
          rewardStatus: 'APPROVED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    },
    reconciliationRun: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    auditLog: {
      count: vi.fn().mockResolvedValue(5),
    },
  },
}))

vi.mock('@/lib/providers/snippe', () => ({
  SnippePaymentAdapter: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockResolvedValue({
      status: 'success',
      data: {
        available_balance: 15500000,
        currency: 'TZS',
      },
    }),
  })),
}))

describe('Financial Reports API Route', () => {
  it('computes live KPIs and P&L statements correctly from real DB queries', async () => {
    const { GET } = await import('../../app/api/admin/financial-reports/route')
    const response = await GET({} as any)
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.kpis).toBeDefined()
    expect(data.kpis.today).toBeDefined()
    expect(data.kpis.thisMonth).toBeDefined()

    // Customer collections = 250,000 + 1,000,000 = 1,250,000 TZS
    expect(data.kpis.today.customerCollectionsTZS).toBe(1250000)

    // Partner rewards today = 90,000 TZS
    expect(data.kpis.today.partnerRewardsTZS).toBe(90000)

    // Statements
    expect(data.statements).toBeDefined()
    expect(data.statements.rows).toHaveLength(5)
    expect(data.statements.totals.lineItem).toBe('NET OPERATING PROFIT')

    // Deal economics
    expect(data.dealEconomics).toHaveLength(1)
    expect(data.dealEconomics[0].dealId).toBe('LUMO-TICK-001')
    expect(data.dealEconomics[0].partnerReward).toBe(75000)
    expect(data.dealEconomics[0].rows).toHaveLength(6)

    // Record Registers
    expect(data.recordRegisters).toHaveLength(15)
    const customerPaymentRegister = data.recordRegisters.find(
      (r: any) => r.id === 'customer_payments'
    )
    expect(customerPaymentRegister).toBeDefined()
    expect(customerPaymentRegister.count).toBe(2)
  })
})
