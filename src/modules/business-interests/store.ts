export interface BusinessInterestLeadRecord {
  id: string
  businessName: string
  contactName: string
  phone: string
  email: string
  category: string
  interests: string[]
  description?: string | null
  website?: string | null
  location?: string | null
  socialMedia?: string | null
  status:
    | 'NEW'
    | 'CONTACTED'
    | 'QUALIFIED'
    | 'ONBOARDING'
    | 'VERIFIED'
    | 'CONVERTED'
    | 'NOT_INTERESTED'
  adminNotes?: string | null
  createdAt: string
  updatedAt: string
}

const memoryLeadsStore: BusinessInterestLeadRecord[] = []

export function recordMemoryLead(data: Omit<BusinessInterestLeadRecord, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string; status?: BusinessInterestLeadRecord['status'] }): BusinessInterestLeadRecord {
  const record: BusinessInterestLeadRecord = {
    id: data.id || `bi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    businessName: data.businessName,
    contactName: data.contactName,
    phone: data.phone,
    email: data.email,
    category: data.category,
    interests: data.interests || [],
    description: data.description || null,
    website: data.website || null,
    location: data.location || null,
    socialMedia: data.socialMedia || null,
    status: data.status || 'NEW',
    adminNotes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  memoryLeadsStore.unshift(record)
  return record
}

export function getMemoryLeads(): BusinessInterestLeadRecord[] {
  return [...memoryLeadsStore]
}

export function findMemoryLeadById(id: string): BusinessInterestLeadRecord | undefined {
  return memoryLeadsStore.find((l) => l.id === id)
}

export function updateMemoryLeadStatus(id: string, status: BusinessInterestLeadRecord['status'], adminNotes?: string): BusinessInterestLeadRecord | undefined {
  const lead = memoryLeadsStore.find((l) => l.id === id)
  if (!lead) return undefined
  lead.status = status
  if (adminNotes !== undefined) lead.adminNotes = adminNotes
  lead.updatedAt = new Date().toISOString()
  return lead
}

export function resetMemoryLeadsStore(): void {
  memoryLeadsStore.length = 0
}
