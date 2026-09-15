import { db } from '@/lib/db'

export interface PayoutRequestItem {
  id: string
  reference: string
  partnerUserId: string
  partnerName: string
  partnerPhone: string
  partnerEmail?: string
  payoutChannel: string
  accountNumber: string
  accountName?: string
  grossAmountTZS: number
  platformFeeTZS: number
  taxWithheldTZS: number
  netAmountTZS: number
  status: 'PENDING_APPROVAL' | 'AUTHORIZED' | 'PAID' | 'REJECTED'
  rejectionReason?: string
  disbursalReference?: string
  disbursedAt?: string
  authorizedBy?: string
  authorizedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// In-memory persistent cache across requests in the Node process
let inMemoryPayouts: PayoutRequestItem[] = []

export function generatePayoutReference(): string {
  const digits = Math.floor(100000 + Math.random() * 900000)
  return `LUMO-PAY-${digits}`
}

/**
 * Creates a new partner payout request.
 * Persists to PostgreSQL if available, otherwise caches in memory.
 */
export async function createPartnerPayoutRequest(params: {
  partnerUserId: string
  partnerName: string
  partnerPhone: string
  partnerEmail?: string
  payoutChannel: string
  accountNumber: string
  accountName?: string
  grossAmountTZS: number
  platformFeeTZS: number
  taxWithheldTZS: number
  netAmountTZS: number
  notes?: string
}): Promise<PayoutRequestItem> {
  const id = `payout_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const reference = generatePayoutReference()
  const now = new Date().toISOString()

  const payoutItem: PayoutRequestItem = {
    id,
    reference,
    partnerUserId: params.partnerUserId,
    partnerName: params.partnerName,
    partnerPhone: params.partnerPhone,
    partnerEmail: params.partnerEmail,
    payoutChannel: params.payoutChannel,
    accountNumber: params.accountNumber,
    accountName: params.accountName || params.partnerName,
    grossAmountTZS: params.grossAmountTZS,
    platformFeeTZS: params.platformFeeTZS,
    taxWithheldTZS: params.taxWithheldTZS,
    netAmountTZS: params.netAmountTZS,
    status: 'PENDING_APPROVAL',
    notes: params.notes,
    createdAt: now,
    updatedAt: now,
  }

  // Try DB persistence
  if (process.env.DATABASE_URL?.trim()) {
    try {
      // Find or create payout method
      let method = await db.payoutMethod.findFirst({
        where: { userId: params.partnerUserId, accountNumber: params.accountNumber },
      })
      if (!method) {
        method = await db.payoutMethod.create({
          data: {
            userId: params.partnerUserId,
            provider: params.payoutChannel,
            accountNumber: params.accountNumber,
            accountName: params.accountName || params.partnerName,
            isDefault: true,
            isVerified: true,
          },
        })
      }

      const created = await db.payout.create({
        data: {
          id,
          partnerUserId: params.partnerUserId,
          payoutMethodId: method.id,
          grossAmountMinor: BigInt(params.grossAmountTZS) * 100n,
          platformFeeMinor: BigInt(params.platformFeeTZS) * 100n,
          taxWithheldMinor: BigInt(params.taxWithheldTZS) * 100n,
          netAmountMinor: BigInt(params.netAmountTZS) * 100n,
          currency: 'TZS',
          providerReference: reference,
          idempotencyKey: `idem_${id}`,
          status: 'PENDING_APPROVAL',
        },
      })
      payoutItem.id = created.id
    } catch (err) {
      console.warn('Database payout creation fallback to memory store:', err)
    }
  }

  // Always keep in memory cache for immediate access
  inMemoryPayouts = [payoutItem, ...inMemoryPayouts]
  return payoutItem
}

/**
 * Lists all payout requests for Admin view.
 */
export async function listAllPayoutRequests(query?: string, status?: string): Promise<PayoutRequestItem[]> {
  const dbItems: PayoutRequestItem[] = []

  if (process.env.DATABASE_URL?.trim()) {
    try {
      const records = await db.payout.findMany({
        orderBy: { createdAt: 'desc' },
        include: { partnerUser: true, payoutMethod: true },
        take: 100,
      })

      for (const p of records) {
        dbItems.push({
          id: p.id,
          reference: p.providerReference || p.id.slice(0, 10),
          partnerUserId: p.partnerUserId,
          partnerName: p.partnerUser?.name || 'Partner',
          partnerPhone: p.partnerUser?.phone || '—',
          partnerEmail: p.partnerUser?.email,
          payoutChannel: p.payoutMethod?.provider || 'MOBILE_MONEY',
          accountNumber: p.payoutMethod?.accountNumber || p.partnerUser?.phone || '—',
          accountName: p.payoutMethod?.accountName || p.partnerUser?.name,
          grossAmountTZS: Number(p.grossAmountMinor / 100n),
          platformFeeTZS: Number(p.platformFeeMinor / 100n),
          taxWithheldTZS: Number(p.taxWithheldMinor / 100n),
          netAmountTZS: Number(p.netAmountMinor / 100n),
          status: p.status as any,
          authorizedBy: p.authorizedBy || undefined,
          authorizedAt: p.authorizedAt ? p.authorizedAt.toISOString() : undefined,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })
      }
    } catch (err) {
      console.warn('Failed to query payouts from DB:', err)
    }
  }

  // Merge DB items with memory items avoiding duplicates
  const itemMap = new Map<string, PayoutRequestItem>()
  for (const item of inMemoryPayouts) {
    itemMap.set(item.id, item)
    if (item.reference) itemMap.set(item.reference, item)
  }
  for (const item of dbItems) {
    itemMap.set(item.id, item)
  }

  let all = Array.from(new Set(itemMap.values())).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  if (status && status !== 'ALL') {
    all = all.filter((p) => p.status === status)
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase()
    all = all.filter(
      (p) =>
        p.reference.toLowerCase().includes(q) ||
        p.partnerName.toLowerCase().includes(q) ||
        p.partnerPhone.toLowerCase().includes(q) ||
        p.accountNumber.toLowerCase().includes(q) ||
        p.payoutChannel.toLowerCase().includes(q)
    )
  }

  return all
}

/**
 * Lists payout requests for a single partner.
 */
export async function listPartnerPayouts(
  partnerUserId: string,
  partnerPhone?: string
): Promise<PayoutRequestItem[]> {
  const all = await listAllPayoutRequests()
  const cleanPhone = partnerPhone?.replace(/\D/g, '')

  return all.filter((p) => {
    if (p.partnerUserId === partnerUserId) return true
    if (cleanPhone && p.partnerPhone.replace(/\D/g, '').includes(cleanPhone)) return true
    return false
  })
}

/**
 * Updates payout request status (Authorize, Disburse, or Reject).
 */
export async function updatePayoutStatus(params: {
  payoutId: string
  action: 'AUTHORIZE' | 'DISBURSE' | 'REJECT'
  adminActor: string
  disbursalReference?: string
  rejectionReason?: string
  notes?: string
}): Promise<PayoutRequestItem | null> {
  const now = new Date().toISOString()
  let target = inMemoryPayouts.find((p) => p.id === params.payoutId || p.reference === params.payoutId)

  const newStatus =
    params.action === 'AUTHORIZE'
      ? 'AUTHORIZED'
      : params.action === 'DISBURSE'
      ? 'PAID'
      : 'REJECTED'

  if (target) {
    target.status = newStatus
    target.updatedAt = now
    if (params.action === 'AUTHORIZE') {
      target.authorizedBy = params.adminActor
      target.authorizedAt = now
    } else if (params.action === 'DISBURSE') {
      target.disbursalReference = params.disbursalReference || `MM-${Date.now().toString().slice(-8)}`
      target.disbursedAt = now
    } else if (params.action === 'REJECT') {
      target.rejectionReason = params.rejectionReason || 'Rejected by compliance administrator.'
    }
    if (params.notes) {
      target.notes = target.notes ? `${target.notes} | ${params.notes}` : params.notes
    }
  }

  // Update DB if present
  if (process.env.DATABASE_URL?.trim()) {
    try {
      const updateData: any = { status: newStatus }
      if (params.action === 'AUTHORIZE') {
        updateData.authorizedBy = params.adminActor
        updateData.authorizedAt = new Date()
      } else if (params.action === 'DISBURSE' && params.disbursalReference) {
        updateData.providerReference = params.disbursalReference
      }
      await db.payout.update({
        where: { id: params.payoutId },
        data: updateData,
      })
    } catch (err) {
      console.warn('Could not update DB payout record:', err)
    }
  }

  return target || null
}
