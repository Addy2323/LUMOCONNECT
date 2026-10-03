import { describe, it, expect, beforeEach } from 'vitest'
import { POST as submitLead, GET as getCategories } from '@/app/api/business-interests/route'
import { GET as getAdminLeads, PATCH as updateAdminLead } from '@/app/api/admin/business-interests/route'
import { resetSmsStore, getSmsJobs } from '@/modules/sms/store'

describe('Business Interest Leads & Automated SMS Dispatch', () => {
  beforeEach(() => {
    resetSmsStore()
  })

  it('provides public categories and interest options via GET /api/business-interests', async () => {
    const res = await getCategories()
    const data = await res.json()

    expect(data.success).toBe(true)
    expect(Array.isArray(data.categories)).toBe(true)
    expect(data.categories).toContain('Sports & Fitness')
    expect(data.interestOptions).toContain('Sell Products')
  })

  it('validates required fields on POST /api/business-interests', async () => {
    const req = new Request('http://localhost/api/business-interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: '',
        contactName: 'Test Contact',
      }),
    })

    const res = await submitLead(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Business Name is required')
  })

  it('successfully creates a business lead and normalizes interests', async () => {
    const req = new Request('http://localhost/api/business-interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Safari Eco Lodge',
        contactName: 'Jane Goodall',
        phone: '0712345678',
        email: 'jane@safarieco.co.tz',
        category: 'Travel & Tourism',
        interests: ['Sell Products', 'Find Customers'],
        description: 'Eco-friendly lodge in Serengeti seeking commercial distribution partners.',
        location: 'Arusha',
      }),
    })

    const res = await submitLead(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.lead).toBeDefined()
    expect(data.lead.businessName).toBe('Safari Eco Lodge')
    expect(data.lead.status).toBe('NEW')
    expect(data.lead.interests).toEqual(['Sell Products', 'Find Customers'])
  })

  it('updates status and triggers auto SMS upon admin approval (ONBOARDING)', async () => {
    // 1. Submit a test lead
    const submitReq = new Request('http://localhost/api/business-interests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Tanzania Solar Tech',
        contactName: 'Rashid Ali',
        phone: '0754987654',
        email: 'rashid@tanzaniasolar.co.tz',
        category: 'Energy & Solar',
        interests: ['Partner Opportunities', 'International Opportunities'],
      }),
    })

    const submitRes = await submitLead(submitReq)
    const submitData = await submitRes.json()
    const leadId = submitData.lead.id

    // 2. Admin approves lead by moving status to ONBOARDING
    const patchReq = new Request('http://localhost/api/admin/business-interests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: leadId,
        status: 'ONBOARDING',
        adminNotes: 'Verified solar distributor credentials. Approving for onboarding.',
      }),
    })

    const patchRes = await updateAdminLead(patchReq)
    const patchData = await patchRes.json()

    expect(patchRes.status).toBe(200)
    expect(patchData.success).toBe(true)
    expect(patchData.lead.status).toBe('ONBOARDING')
    expect(patchData.sms).toBeDefined()
    expect(patchData.sms.message).toContain('https://lumo.co.tz/choose-path')

    // 3. Verify SMS job was recorded in SMS store
    const smsJobs = getSmsJobs()
    expect(smsJobs.length).toBeGreaterThan(0)
    const approvalSms = smsJobs.find((j) => j.templateCode === 'BUSINESS_LEAD_APPROVED')
    expect(approvalSms).toBeDefined()
    expect(approvalSms?.messageText).toContain('Tanzania Solar Tech')
    expect(approvalSms?.messageText).toContain('https://lumo.co.tz/choose-path')
  })
})
