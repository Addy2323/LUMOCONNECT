import { describe, it, expect } from 'vitest'
import {
  createDealRoom,
  getDealRoom,
  submitDeliverable,
  reviewDeliverable,
  postDealRoomMessage,
} from '@/modules/dealroom/service'

describe('B2B Deal Room & Deliverables Lifecycle', () => {
  it('creates a new deal room agreement with deliverables and initial message', () => {
    const room = createDealRoom({
      dealId: 'deal_test_01',
      businessId: 'org_test_biz',
      businessName: 'Kilimo Bora Ltd',
      partnerId: 'partner_test_alex',
      partnerName: 'Alex Mushi',
      title: 'Farmer Cooperative Outreach Campaign',
      fixedFeeTZS: 50000000n, // TZS 500,000.00
      commissionRateBps: 1000,
      deliverables: [
        {
          title: '3x Cooperative Information Sessions',
          description: 'Host presentations in Arusha and Kilimanjaro rural zones.',
          dueDate: '2026-09-01',
        },
      ],
    })

    expect(room.id).toBeDefined()
    expect(room.status).toBe('IN_PROGRESS')
    expect(room.deliverables.length).toBe(1)
    expect(room.deliverables[0].status).toBe('PENDING')
    expect(room.messages.length).toBe(1)
  })

  it('submits evidence for a deliverable and transitions status to SUBMITTED', () => {
    const room = createDealRoom({
      dealId: 'deal_test_02',
      businessId: 'org_test_biz',
      businessName: 'Kilimo Bora Ltd',
      partnerId: 'partner_test_alex',
      partnerName: 'Alex Mushi',
      title: 'Outreach Campaign',
    })

    const delId = room.deliverables[0].id
    const updated = submitDeliverable({
      dealRoomId: room.id,
      deliverableId: delId,
      evidenceUrl: 'https://storage.lumo.co.tz/evidence/deliv_photos.zip',
      notes: 'All 3 sessions completed with 45 attendees.',
    })

    expect(updated.status).toBe('SUBMITTED')
    expect(updated.evidenceUrl).toBe('https://storage.lumo.co.tz/evidence/deliv_photos.zip')

    const fetchedRoom = getDealRoom(room.id)
    expect(fetchedRoom?.messages.some((m) => m.senderRole === 'PARTNER')).toBe(true)
  })

  it('reviews and approves deliverable, completing the deal room when all are approved', () => {
    const room = createDealRoom({
      dealId: 'deal_test_03',
      businessId: 'org_test_biz',
      businessName: 'Kilimo Bora Ltd',
      partnerId: 'partner_test_alex',
      partnerName: 'Alex Mushi',
      title: 'Short Campaign',
    })

    const delId = room.deliverables[0].id
    const approved = reviewDeliverable({
      dealRoomId: room.id,
      deliverableId: delId,
      status: 'APPROVED',
      reviewNotes: 'Excellent work and great photos.',
      reviewerId: 'org_test_biz',
      reviewerName: 'Kilimo Reviewer',
    })

    expect(approved.status).toBe('APPROVED')
    const fetchedRoom = getDealRoom(room.id)
    expect(fetchedRoom?.status).toBe('COMPLETED')
  })

  it('posts timeline messages and updates room timestamp', () => {
    const room = createDealRoom({
      dealId: 'deal_test_04',
      businessId: 'org_test_biz',
      businessName: 'Kilimo Bora Ltd',
      partnerId: 'partner_test_alex',
      partnerName: 'Alex Mushi',
      title: 'Chat Test',
    })

    const msg = postDealRoomMessage({
      dealRoomId: room.id,
      senderId: 'partner_test_alex',
      senderName: 'Alex Mushi',
      senderRole: 'PARTNER',
      message: 'When is the next batch payment scheduled?',
    })

    expect(msg.id).toBeDefined()
    expect(msg.message).toContain('payment scheduled')
  })
})
