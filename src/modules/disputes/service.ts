export interface DisputeItem {
  id: string
  disputeNumber: string
  organizationId: string
  dealTitle: string
  partnerName: string
  title: string
  reason: string
  amountTZS: string
  status: 'OPENED' | 'UNDER_REVIEW' | 'RESOLVED_PARTNER_FAVOR' | 'RESOLVED_BUSINESS_FAVOR' | 'CLOSED'
  createdAt: Date
  messages: {
    sender: string
    text: string
    timestamp: Date
  }[]
}

const disputesStore: DisputeItem[] = []

export function listDisputes(): DisputeItem[] {
  return disputesStore
}

export function getDisputeById(id: string): DisputeItem | undefined {
  return disputesStore.find((d) => d.id === id)
}

export function openDispute({
  organizationId,
  dealTitle,
  partnerName,
  title,
  reason,
  amountTZS,
  initialEvidence,
  openedBy,
}: {
  organizationId: string
  dealTitle: string
  partnerName: string
  title: string
  reason: string
  amountTZS: string
  initialEvidence?: string
  openedBy: string
}): DisputeItem {
  const dispId = `disp_${Date.now()}`
  const disputeNum = `LUMO-DISP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`
  const now = new Date()

  const initialMessages = [
    {
      sender: openedBy,
      text: reason + (initialEvidence ? ` Evidence link: ${initialEvidence}` : ''),
      timestamp: now,
    },
    {
      sender: 'LUMO Support & Compliance Engine',
      text: 'Dispute opened. Funds are placed on temporary escrow hold while both parties submit corroborating evidence.',
      timestamp: now,
    },
  ]

  const newDispute: DisputeItem = {
    id: dispId,
    disputeNumber: disputeNum,
    organizationId,
    dealTitle,
    partnerName,
    title,
    reason,
    amountTZS,
    status: 'OPENED',
    createdAt: now,
    messages: initialMessages,
  }

  disputesStore.unshift(newDispute)
  return newDispute
}

export function addDisputeMessage({
  disputeId,
  sender,
  text,
}: {
  disputeId: string
  sender: string
  text: string
}): DisputeItem {
  const dispute = getDisputeById(disputeId)
  if (!dispute) throw new Error('DISPUTE_NOT_FOUND')

  dispute.messages.push({
    sender,
    text,
    timestamp: new Date(),
  })

  if (dispute.status === 'OPENED') {
    dispute.status = 'UNDER_REVIEW'
  }

  return dispute
}

export function resolveDispute({
  disputeId,
  decision,
  resolutionNotes,
  resolverId,
}: {
  disputeId: string
  decision: 'RESOLVED_PARTNER_FAVOR' | 'RESOLVED_BUSINESS_FAVOR'
  resolutionNotes: string
  resolverId: string
}): DisputeItem {
  const dispute = getDisputeById(disputeId)
  if (!dispute) throw new Error('DISPUTE_NOT_FOUND')

  dispute.status = decision
  dispute.messages.push({
    sender: `Admin Arbitrator (${resolverId})`,
    text: `Arbitration outcome: ${decision}. Findings: ${resolutionNotes}`,
    timestamp: new Date(),
  })

  return dispute
}

