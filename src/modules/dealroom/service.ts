export interface DealRoomDeliverable {
  id: string
  title: string
  description: string
  dueDate: string
  status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED'
  evidenceUrl?: string
  reviewNotes?: string
}

export interface DealRoomMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: 'BUSINESS' | 'PARTNER' | 'LUMO_FACILITATOR'
  message: string
  attachmentUrl?: string
  timestamp: Date
}

export interface DealRoomAgreement {
  id: string
  dealId: string
  businessId: string
  businessName: string
  partnerId: string
  partnerName: string
  title: string
  currentVersion: number
  fixedFeeTZS: bigint
  commissionRateBps?: number
  currency: string
  status: 'OFFER_MADE' | 'COUNTER_OFFER' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED'
  deliverables: DealRoomDeliverable[]
  messages: DealRoomMessage[]
  createdAt: Date
  updatedAt: Date
}

const dealRooms: DealRoomAgreement[] = []

export function getDealRoom(id: string): DealRoomAgreement | undefined {
  return dealRooms.find((r) => r.id === id)
}

export function listDealRoomsForUser(userId: string): DealRoomAgreement[] {
  return dealRooms.filter((r) => r.partnerId === userId || r.businessId === userId)
}

export function createDealRoom(params: {
  dealId: string
  businessId: string
  businessName: string
  partnerId: string
  partnerName: string
  title: string
  fixedFeeTZS?: bigint
  commissionRateBps?: number
  deliverables?: Omit<DealRoomDeliverable, 'id' | 'status'>[]
}): DealRoomAgreement {
  const roomId = `dr_${Date.now()}`
  const now = new Date()

  const deliverables: DealRoomDeliverable[] = (params.deliverables || [
    {
      title: 'Initial Commercial Campaign Kickoff',
      description: 'Review brand guidelines and confirm marketing channels.',
      dueDate: new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10),
    },
  ]).map((d, idx) => ({
    ...d,
    id: `del_${idx + 1}`,
    status: 'PENDING',
  }))

  const room: DealRoomAgreement = {
    id: roomId,
    dealId: params.dealId,
    businessId: params.businessId,
    businessName: params.businessName,
    partnerId: params.partnerId,
    partnerName: params.partnerName,
    title: params.title,
    currentVersion: 1,
    fixedFeeTZS: params.fixedFeeTZS || 0n,
    commissionRateBps: params.commissionRateBps || 1000,
    currency: 'TZS',
    status: 'IN_PROGRESS',
    deliverables,
    messages: [
      {
        id: `msg_${Date.now()}`,
        senderId: params.businessId,
        senderName: params.businessName,
        senderRole: 'BUSINESS',
        message: `Deal room initialized for ${params.title}. Review agreed deliverables and timeline below.`,
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  dealRooms.unshift(room)
  return room
}

export function submitDeliverable({
  dealRoomId,
  deliverableId,
  evidenceUrl,
  notes,
}: {
  dealRoomId: string
  deliverableId: string
  evidenceUrl: string
  notes?: string
}): DealRoomDeliverable {
  const room = getDealRoom(dealRoomId)
  if (!room) throw new Error('DEAL_ROOM_NOT_FOUND')

  const del = room.deliverables.find((d) => d.id === deliverableId)
  if (!del) throw new Error('DELIVERABLE_NOT_FOUND')

  del.status = 'SUBMITTED'
  del.evidenceUrl = evidenceUrl
  if (notes) del.reviewNotes = notes
  room.updatedAt = new Date()

  // Add system message
  room.messages.push({
    id: `msg_${Date.now()}`,
    senderId: room.partnerId,
    senderName: room.partnerName,
    senderRole: 'PARTNER',
    message: `Submitted evidence for deliverable: "${del.title}". Review link: ${evidenceUrl}`,
    attachmentUrl: evidenceUrl,
    timestamp: new Date(),
  })

  return del
}

export function reviewDeliverable({
  dealRoomId,
  deliverableId,
  status,
  reviewNotes,
  reviewerId,
  reviewerName,
}: {
  dealRoomId: string
  deliverableId: string
  status: 'APPROVED' | 'REVISION_REQUESTED'
  reviewNotes: string
  reviewerId: string
  reviewerName: string
}): DealRoomDeliverable {
  const room = getDealRoom(dealRoomId)
  if (!room) throw new Error('DEAL_ROOM_NOT_FOUND')

  const del = room.deliverables.find((d) => d.id === deliverableId)
  if (!del) throw new Error('DELIVERABLE_NOT_FOUND')

  del.status = status
  del.reviewNotes = reviewNotes
  room.updatedAt = new Date()

  // Check if all deliverables are approved
  const allApproved = room.deliverables.every((d) => d.status === 'APPROVED')
  if (allApproved) {
    room.status = 'COMPLETED'
  }

  // Add notification message to timeline
  room.messages.push({
    id: `msg_${Date.now()}`,
    senderId: reviewerId,
    senderName: reviewerName,
    senderRole: 'BUSINESS',
    message: `Deliverable "${del.title}" marked as ${status}. Feedback: ${reviewNotes}`,
    timestamp: new Date(),
  })

  return del
}

export function postDealRoomMessage({
  dealRoomId,
  senderId,
  senderName,
  senderRole,
  message,
  attachmentUrl,
}: {
  dealRoomId: string
  senderId: string
  senderName: string
  senderRole: 'BUSINESS' | 'PARTNER' | 'LUMO_FACILITATOR'
  message: string
  attachmentUrl?: string
}): DealRoomMessage {
  const room = getDealRoom(dealRoomId)
  if (!room) throw new Error('DEAL_ROOM_NOT_FOUND')

  const msg: DealRoomMessage = {
    id: `msg_${Date.now()}`,
    senderId,
    senderName,
    senderRole,
    message,
    attachmentUrl,
    timestamp: new Date(),
  }

  room.messages.push(msg)
  room.updatedAt = new Date()
  return msg
}

