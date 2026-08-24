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

const dealRooms: DealRoomAgreement[] = [
  {
    id: 'dr_safaribox_alex',
    dealId: 'deal_sb_01',
    businessId: 'org_safaribox',
    businessName: 'SafariBox Serengeti',
    partnerId: 'partner_alex',
    partnerName: 'Alex Mushi',
    title: 'Serengeti Migration Visual Creator Campaign',
    currentVersion: 1,
    fixedFeeTZS: BigInt(45000000), // TZS 450,000.00
    commissionRateBps: 800, // 8.00%
    currency: 'TZS',
    status: 'IN_PROGRESS',
    deliverables: [
      {
        id: 'del_1',
        title: 'High-Res Photo Gallery (15 Curated Images)',
        description: 'Delivered in RAW + processed JPEG format depicting camp amenities and safari game drives.',
        dueDate: '2026-08-28',
        status: 'APPROVED',
        evidenceUrl: 'https://storage.lumo.co.tz/evidence/del_1_gallery.zip',
        reviewNotes: 'Stunning visual quality! Approved for marketing library.',
      },
      {
        id: 'del_2',
        title: '3x 4K Instagram Reels / TikTok Shorts',
        description: 'Featuring lodge tent sunrise, bush dinner, and hot air balloon experience with booking tags.',
        dueDate: '2026-09-02',
        status: 'SUBMITTED',
        evidenceUrl: 'https://instagram.com/p/mock_reel_02',
      },
      {
        id: 'del_3',
        title: 'LUMO Tracking Link Performance Report',
        description: 'Summary of click traffic and customer reservation inquiries.',
        dueDate: '2026-09-15',
        status: 'PENDING',
      },
    ],
    messages: [
      {
        id: 'msg_1',
        senderId: 'user_sb_01',
        senderName: 'SafariBox Marketing',
        senderRole: 'BUSINESS',
        message: 'Welcome Alex! We have sent through the initial agreement with TZS 450,000 fixed fee and 8% booking commission.',
        timestamp: new Date('2026-08-11T10:00:00Z'),
      },
      {
        id: 'msg_2',
        senderId: 'partner_alex',
        senderName: 'Alex Mushi',
        senderRole: 'PARTNER',
        message: 'Offer accepted! First gallery deliverable has been uploaded for review.',
        timestamp: new Date('2026-08-15T14:30:00Z'),
      },
    ],
    createdAt: new Date('2026-08-11T10:00:00Z'),
    updatedAt: new Date('2026-08-15T14:30:00Z'),
  },
]

export function getDealRoom(id: string): DealRoomAgreement | undefined {
  return dealRooms.find((r) => r.id === id)
}

export function postDealRoomMessage({
  dealRoomId,
  senderId,
  senderName,
  senderRole,
  message,
}: {
  dealRoomId: string
  senderId: string
  senderName: string
  senderRole: 'BUSINESS' | 'PARTNER' | 'LUMO_FACILITATOR'
  message: string
}): DealRoomMessage {
  const room = getDealRoom(dealRoomId)
  if (!room) throw new Error('DEAL_ROOM_NOT_FOUND')

  const msg: DealRoomMessage = {
    id: `msg_${Date.now()}`,
    senderId,
    senderName,
    senderRole,
    message,
    timestamp: new Date(),
  }

  room.messages.push(msg)
  room.updatedAt = new Date()
  return msg
}
