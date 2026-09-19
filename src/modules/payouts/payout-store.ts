import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

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
  const id = randomUUID()
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
          disbursalReference: p.providerBatchRef || undefined,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })
      }
    } catch (err) {
      console.warn('Failed to query payouts from DB:', err)
    }
  }

  // Deduplicate strictly by payout reference (or id fallback) so DB and in-memory cache never produce duplicates
  const byRef = new Map<string, PayoutRequestItem>()
  for (const item of dbItems) {
    const key = item.reference?.trim() || item.id
    byRef.set(key, item)
  }
  for (const item of inMemoryPayouts) {
    const key = item.reference?.trim() || item.id
    const existing = byRef.get(key)
    if (!existing) {
      byRef.set(key, item)
    } else {
      // Merge richer in-memory fields into the DB record
      if (!existing.disbursalReference && item.disbursalReference) {
        existing.disbursalReference = item.disbursalReference
      }
      if (!existing.rejectionReason && item.rejectionReason) {
        existing.rejectionReason = item.rejectionReason
      }
      if (!existing.notes && item.notes) {
        existing.notes = item.notes
      }
    }
  }

  let all = Array.from(byRef.values()).sort(
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
 * Lists payout requests strictly for a single partner.
 * Guaranteed account isolation: only returns records matching partnerUserId.
 */
export async function listPartnerPayouts(
  partnerUserId: string,
  partnerPhone?: string
): Promise<PayoutRequestItem[]> {
  if (!partnerUserId) return []

  const dbItems: PayoutRequestItem[] = []
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(partnerUserId)
  if (process.env.DATABASE_URL?.trim() && isUuid) {
    try {
      const records = await db.payout.findMany({
        where: { partnerUserId },
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
          disbursalReference: p.providerBatchRef || undefined,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })
      }
    } catch (err) {
      console.warn('Failed to query partner payouts from DB:', err)
    }
  }

  // Combine with in-memory store matching partnerUserId, deduplicating strictly by reference (or id fallback)
  const byRef = new Map<string, PayoutRequestItem>()
  for (const item of dbItems) {
    const key = item.reference?.trim() || item.id
    byRef.set(key, item)
  }
  const memoryItems = inMemoryPayouts.filter((p) => p.partnerUserId === partnerUserId)
  for (const item of memoryItems) {
    const key = item.reference?.trim() || item.id
    const existing = byRef.get(key)
    if (!existing) {
      byRef.set(key, item)
    } else {
      if (!existing.disbursalReference && item.disbursalReference) {
        existing.disbursalReference = item.disbursalReference
      }
      if (!existing.rejectionReason && item.rejectionReason) {
        existing.rejectionReason = item.rejectionReason
      }
      if (!existing.notes && item.notes) {
        existing.notes = item.notes
      }
    }
  }

  return Array.from(byRef.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
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
      } else if (params.action === 'DISBURSE') {
        if (params.disbursalReference || target?.disbursalReference) {
          updateData.providerBatchRef = params.disbursalReference || target?.disbursalReference
        }
      }
      await db.payout.update({
        where: { id: params.payoutId },
        data: updateData,
      })

      // If disbursed, advance any linked referral ticket to REWARD_PAID
      if (params.action === 'DISBURSE') {
        try {
          const matchTicketRef = (target?.notes || params.notes || '').match(/(LUMO-CON-[A-Z0-9-]+|LUMO-REF-[A-Z0-9-]+|REF-[A-Z0-9-]+)/i)
          const linkedTicket = await db.referralTicket.findFirst({
            where: {
              OR: [
                { specifications: { contains: params.payoutId } },
                ...(target?.reference ? [{ specifications: { contains: target.reference } }] : []),
                ...(target?.reference ? [{ partnerVisibleUpdate: { contains: target.reference } }] : []),
                ...(target?.reference ? [{ coordinatorNotes: { contains: target.reference } }] : []),
                ...(matchTicketRef ? [{ ticketReference: matchTicketRef[1] }] : []),
              ],
            },
          })
          if (linkedTicket && linkedTicket.stage !== 'REWARD_PAID') {
            const { updateReferralTicketStage } = await import('@/modules/deals/referral-cases')
            await updateReferralTicketStage(linkedTicket.id, 'REWARD_PAID', {
              rewardStatus: 'PAID',
              partnerVisibleUpdate: `Reward payout disbursed! Ref: ${params.disbursalReference || target?.disbursalReference || 'DISBURSED'}. Funds sent to your account.`,
              coordinatorNotes: `Admin ${params.adminActor} disbursed payout (${params.disbursalReference || 'DISBURSED'}). Stage updated to REWARD_PAID.`,
            })
          }
        } catch (syncErr) {
          console.warn('Could not auto-advance linked referral ticket on payout disbursal:', syncErr)
        }
      }
    } catch (err) {
      console.warn('Could not update DB payout record:', err)
    }
  }

  return target || null
}
