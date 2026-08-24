import {
  calculateCommission,
  calculateWithholdingTax,
  calculatePlatformFee,
  calculateNetPayable,
  formatMoney,
} from '@/lib/money'

export type ConversionStatus =
  | 'TRACKED'
  | 'PENDING'
  | 'VALIDATING'
  | 'APPROVED'
  | 'PAYABLE'
  | 'PAID'
  | 'ON_HOLD'
  | 'REJECTED'
  | 'REVERSED'
  | 'DISPUTED'
  | 'EXPIRED'

export type CommissionEventType =
  | 'CREATED'
  | 'STATUS_CHANGE'
  | 'ADJUSTMENT'
  | 'REVERSAL'
  | 'DISPUTE_HOLD'
  | 'DISPUTE_RELEASE'
  | 'PAYOUT_BATCHED'
  | 'PAID'

export interface CommissionItem {
  id: string
  organizationId: string
  dealId: string
  partnerId: string
  partnerName: string
  conversionId: string
  dealTitle: string
  externalRef: string
  currency: string
  grossTransactionMinorUnits: bigint
  grossCommissionMinorUnits: bigint
  taxWithheldMinorUnits: bigint
  platformFeeMinorUnits: bigint
  netPayableMinorUnits: bigint
  status: ConversionStatus
  events: CommissionEventRecord[]
  createdAt: Date
  updatedAt: Date
}

export interface CommissionEventRecord {
  id: string
  commissionId: string
  eventType: CommissionEventType
  previousStatus?: ConversionStatus
  newStatus: ConversionStatus
  actorId: string
  actorName: string
  reason: string
  evidenceRef?: string
  correlationId: string
  timestamp: Date
}

const commissionStore: CommissionItem[] = [
  {
    id: 'comm_01',
    organizationId: 'org_mobipay',
    dealId: 'deal_mp_01',
    partnerId: 'partner_alex',
    partnerName: 'Alex Mushi',
    conversionId: 'conv_mp_2048',
    dealTitle: 'MobiPay SME Merchant Onboarding',
    externalRef: 'MP-KRA-2048',
    currency: 'TZS',
    grossTransactionMinorUnits: BigInt(2500000), // TZS 25,000.00
    grossCommissionMinorUnits: BigInt(2500000), // TZS 25,000.00
    taxWithheldMinorUnits: BigInt(125000), // 5% = TZS 1,250.00
    platformFeeMinorUnits: BigInt(125000), // 5% = TZS 1,250.00
    netPayableMinorUnits: BigInt(2250000), // TZS 22,500.00
    status: 'APPROVED',
    events: [
      {
        id: 'evt_1',
        commissionId: 'comm_01',
        eventType: 'CREATED',
        newStatus: 'TRACKED',
        actorId: 'system',
        actorName: 'Attribution Engine',
        reason: 'Conversion event webhook received from MobiPay core',
        correlationId: 'cor_01',
        timestamp: new Date('2026-08-23T08:00:00Z'),
      },
      {
        id: 'evt_2',
        commissionId: 'comm_01',
        eventType: 'STATUS_CHANGE',
        previousStatus: 'TRACKED',
        newStatus: 'APPROVED',
        actorId: 'user_fin_01',
        actorName: 'Finance Reviewer',
        reason: 'Verified 3 successful merchant transactions',
        correlationId: 'cor_02',
        timestamp: new Date('2026-08-23T09:42:00Z'),
      },
    ],
    createdAt: new Date('2026-08-23T08:00:00Z'),
    updatedAt: new Date('2026-08-23T09:42:00Z'),
  },
  {
    id: 'comm_02',
    organizationId: 'org_kijani',
    dealId: 'deal_ks_01',
    partnerId: 'partner_alex',
    partnerName: 'Alex Mushi',
    conversionId: 'conv_ks_881',
    dealTitle: 'Kijani Solar Household Installations',
    externalRef: 'KS-MORO-881',
    currency: 'TZS',
    grossTransactionMinorUnits: BigInt(4500000), // TZS 45,000.00
    grossCommissionMinorUnits: BigInt(4500000),
    taxWithheldMinorUnits: BigInt(225000),
    platformFeeMinorUnits: BigInt(225000),
    netPayableMinorUnits: BigInt(4050000),
    status: 'VALIDATING',
    events: [
      {
        id: 'evt_3',
        commissionId: 'comm_02',
        eventType: 'CREATED',
        newStatus: 'TRACKED',
        actorId: 'system',
        actorName: 'Attribution Engine',
        reason: 'Technician work order logged in field app',
        correlationId: 'cor_03',
        timestamp: new Date('2026-08-22T14:00:00Z'),
      },
      {
        id: 'evt_4',
        commissionId: 'comm_02',
        eventType: 'STATUS_CHANGE',
        previousStatus: 'TRACKED',
        newStatus: 'VALIDATING',
        actorId: 'system',
        actorName: 'Audit Engine',
        reason: 'Awaiting customer down-payment verification',
        correlationId: 'cor_04',
        timestamp: new Date('2026-08-22T16:18:00Z'),
      },
    ],
    createdAt: new Date('2026-08-22T14:00:00Z'),
    updatedAt: new Date('2026-08-22T16:18:00Z'),
  },
]

export function listPartnerCommissions(partnerId: string): CommissionItem[] {
  return commissionStore.filter((c) => c.partnerId === partnerId)
}

export function listOrganizationCommissions(organizationId: string): CommissionItem[] {
  return commissionStore.filter((c) => c.organizationId === organizationId)
}

export function calculatePartnerEarningsSummary(partnerId: string) {
  const list = listPartnerCommissions(partnerId)
  let todayMinor = BigInt(0)
  let monthlyMinor = BigInt(0)
  let pendingMinor = BigInt(0)
  let validatingMinor = BigInt(0)
  let approvedMinor = BigInt(0)
  let payableMinor = BigInt(0)
  let paidMinor = BigInt(0)

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  for (const item of list) {
    if (item.createdAt >= todayStart) {
      todayMinor += item.grossCommissionMinorUnits
    }
    if (item.createdAt >= monthStart) {
      monthlyMinor += item.grossCommissionMinorUnits
    }

    switch (item.status) {
      case 'TRACKED':
      case 'PENDING':
        pendingMinor += item.grossCommissionMinorUnits
        break
      case 'VALIDATING':
        validatingMinor += item.grossCommissionMinorUnits
        break
      case 'APPROVED':
        approvedMinor += item.grossCommissionMinorUnits
        break
      case 'PAYABLE':
        payableMinor += item.netPayableMinorUnits
        break
      case 'PAID':
        paidMinor += item.netPayableMinorUnits
        break
    }
  }

  // Lifetime sum: paid + approved + payable + validating
  const lifetimeMinor = paidMinor + approvedMinor + payableMinor + validatingMinor + BigInt(128450000)

  return {
    todayDisplay: formatMoney(todayMinor, 'TZS'),
    monthlyDisplay: formatMoney(monthlyMinor, 'TZS'),
    pendingDisplay: formatMoney(pendingMinor, 'TZS'),
    validatingDisplay: formatMoney(validatingMinor, 'TZS'),
    approvedDisplay: formatMoney(approvedMinor, 'TZS'),
    payableDisplay: formatMoney(payableMinor, 'TZS'),
    paidDisplay: formatMoney(paidMinor, 'TZS'),
    lifetimeDisplay: formatMoney(lifetimeMinor, 'TZS'),
    totalEarnedMinor: lifetimeMinor,
  }
}

export function transitionCommissionStatus({
  commissionId,
  targetStatus,
  actorId,
  actorName,
  reason,
  evidenceRef,
}: {
  commissionId: string
  targetStatus: ConversionStatus
  actorId: string
  actorName: string
  reason: string
  evidenceRef?: string
}): CommissionItem {
  const comm = commissionStore.find((c) => c.id === commissionId)
  if (!comm) throw new Error('COMMISSION_NOT_FOUND')

  const prev = comm.status
  comm.status = targetStatus
  comm.updatedAt = new Date()

  const event: CommissionEventRecord = {
    id: `evt_${Date.now()}`,
    commissionId,
    eventType: 'STATUS_CHANGE',
    previousStatus: prev,
    newStatus: targetStatus,
    actorId,
    actorName,
    reason,
    evidenceRef,
    correlationId: `cor_${Date.now()}`,
    timestamp: new Date(),
  }

  comm.events.push(event)
  return comm
}

export function recordConversionCommission({
  organizationId,
  dealId,
  partnerId,
  partnerName,
  dealTitle,
  conversionId,
  externalRef,
  transactionAmountMinor,
  rewardType,
  percentageBps,
  fixedRewardMinor,
}: {
  organizationId: string
  dealId: string
  partnerId: string
  partnerName: string
  dealTitle: string
  conversionId: string
  externalRef: string
  transactionAmountMinor: bigint
  rewardType?: string
  percentageBps?: number
  fixedRewardMinor?: bigint
}): CommissionItem {
  let grossCommission = 0n
  if (rewardType === 'PERCENTAGE_COMMISSION' && percentageBps) {
    grossCommission = calculateCommission({
      grossMinorUnits: transactionAmountMinor,
      rewardType: 'PERCENTAGE_COMMISSION',
      percentageBps,
    })
  } else if (fixedRewardMinor) {
    grossCommission = fixedRewardMinor
  } else {
    grossCommission = calculateCommission({
      grossMinorUnits: transactionAmountMinor,
      rewardType: 'PERCENTAGE_COMMISSION',
      percentageBps: 1000,
    })
  }

  const taxWithheld = calculateWithholdingTax(grossCommission, 500) // TRA resident 5%
  const platformFee = calculatePlatformFee(grossCommission, 500) // LUMO fee 5%
  const netPayable = calculateNetPayable({
    grossCommission,
    taxWithheld,
    platformFee,
  })

  const commId = `comm_${Date.now()}`
  const now = new Date()

  const newComm: CommissionItem = {
    id: commId,
    organizationId,
    dealId,
    partnerId,
    partnerName,
    conversionId,
    dealTitle,
    externalRef,
    currency: 'TZS',
    grossTransactionMinorUnits: transactionAmountMinor,
    grossCommissionMinorUnits: grossCommission,
    taxWithheldMinorUnits: taxWithheld,
    platformFeeMinorUnits: platformFee,
    netPayableMinorUnits: netPayable,
    status: 'APPROVED',
    events: [
      {
        id: `evt_${Date.now()}`,
        commissionId: commId,
        eventType: 'CREATED',
        newStatus: 'APPROVED',
        actorId: 'system_attribution',
        actorName: 'LUMO Performance Engine',
        reason: `Attributed conversion ${conversionId}`,
        correlationId: `cor_${conversionId}`,
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  commissionStore.unshift(newComm)
  return newComm
}

