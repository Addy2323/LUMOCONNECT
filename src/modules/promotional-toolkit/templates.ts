export interface PromotionalTemplate {
  id: string
  name: string
  version: number
  status: 'DRAFT' | 'PUBLISHED'
  isDefault: boolean
  brandColors: {
    primary: string // Lumo orange #FF6A00
    darkNavy: string // #0B132B
    accentGold: string // #D97706
  }
  fontFamily: string
  logoUrl: string
  aspectRatios: Array<'SQUARE_1_1' | 'PORTRAIT_9_16' | 'LANDSCAPE_16_9'>
  imageSettings: {
    cropMode: 'cover' | 'contain'
    maxTitleLength: number
    maxDescriptionLength: number
  }
  publicFieldToggles: {
    showPrice: boolean
    showLocation: boolean
    showSpecs: boolean
    showQrCode: boolean
    showRefCode: boolean
  }
  ctaTextEn: string
  ctaTextSw: string
  categoryOverrides: Record<string, string> // e.g. { "Property": "template_property_01" }
  createdAt: string
  updatedAt: string
}

export interface TemplateAuditLog {
  id: string
  templateId: string
  templateName: string
  action: 'CREATED' | 'DRAFT_SAVED' | 'VERSION_PUBLISHED' | 'VERSION_RESTORED' | 'DEFAULT_SET'
  version: number
  actorAdmin: string
  timestamp: string
  notes?: string
}

export const DEFAULT_PROMOTIONAL_TEMPLATE: PromotionalTemplate = {
  id: 'template_default_v1',
  name: 'Standard Lumo Promotional Template',
  version: 1,
  status: 'PUBLISHED',
  isDefault: true,
  brandColors: {
    primary: '#FF6A00',
    darkNavy: '#0B132B',
    accentGold: '#D97706',
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  logoUrl: '/logo/lumodealers-white.png',
  aspectRatios: ['SQUARE_1_1', 'PORTRAIT_9_16', 'LANDSCAPE_16_9'],
  imageSettings: {
    cropMode: 'cover',
    maxTitleLength: 75,
    maxDescriptionLength: 160,
  },
  publicFieldToggles: {
    showPrice: true,
    showLocation: true,
    showSpecs: true,
    showQrCode: true,
    showRefCode: true,
  },
  ctaTextEn: 'View Details & Contact Lumo',
  ctaTextSw: 'Tazama Maelezo & Wasiliana na Lumo',
  categoryOverrides: {},
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-14T00:00:00Z',
}

let inMemoryTemplates: PromotionalTemplate[] = [DEFAULT_PROMOTIONAL_TEMPLATE]
let templateHistory: PromotionalTemplate[] = [DEFAULT_PROMOTIONAL_TEMPLATE]
let inMemoryAuditLogs: TemplateAuditLog[] = [
  {
    id: 'audit_init_01',
    templateId: DEFAULT_PROMOTIONAL_TEMPLATE.id,
    templateName: DEFAULT_PROMOTIONAL_TEMPLATE.name,
    action: 'VERSION_PUBLISHED',
    version: 1,
    actorAdmin: 'System Administrator',
    timestamp: '2026-09-01T00:00:00Z',
    notes: 'Initial default promotional template published.',
  },
]

function loadTemplatesFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('lumo_promo_templates')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryTemplates = parsed
        }
      }
      const logs = localStorage.getItem('lumo_promo_template_logs')
      if (logs) {
        const parsedLogs = JSON.parse(logs)
        if (Array.isArray(parsedLogs)) {
          inMemoryAuditLogs = parsedLogs
        }
      }
    } catch (e) {
      console.warn('Could not load promo templates from storage', e)
    }
  }
}

function syncTemplatesToStorage() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('lumo_promo_templates', JSON.stringify(inMemoryTemplates))
      localStorage.setItem('lumo_promo_template_logs', JSON.stringify(inMemoryAuditLogs))
      window.dispatchEvent(new Event('lumo:templates-updated'))
    } catch (e) {
      console.warn('Could not sync promo templates to storage', e)
    }
  }
}

// Initial load
loadTemplatesFromStorage()

export function getActiveTemplate(): PromotionalTemplate {
  loadTemplatesFromStorage()
  const defaultTpl = inMemoryTemplates.find((t) => t.isDefault && t.status === 'PUBLISHED')
  return defaultTpl || inMemoryTemplates[0] || DEFAULT_PROMOTIONAL_TEMPLATE
}

export function getTemplateForCategory(category?: string): PromotionalTemplate {
  loadTemplatesFromStorage()
  const active = getActiveTemplate()
  if (category && active.categoryOverrides[category]) {
    const overrideId = active.categoryOverrides[category]
    const overrideTpl = inMemoryTemplates.find((t) => t.id === overrideId && t.status === 'PUBLISHED')
    if (overrideTpl) return overrideTpl
  }
  return active
}

export function listPromotionalTemplates(): PromotionalTemplate[] {
  loadTemplatesFromStorage()
  return [...inMemoryTemplates]
}

export function saveTemplateDraft(
  template: Partial<PromotionalTemplate> & { name: string },
  adminName = 'Admin'
): PromotionalTemplate {
  loadTemplatesFromStorage()

  const existingIdx = inMemoryTemplates.findIndex((t) => t.id === template.id)
  let updated: PromotionalTemplate

  if (existingIdx >= 0) {
    const existing = inMemoryTemplates[existingIdx]
    updated = {
      ...existing,
      ...template,
      status: 'DRAFT',
      updatedAt: new Date().toISOString(),
    }
    inMemoryTemplates[existingIdx] = updated
  } else {
    updated = {
      ...DEFAULT_PROMOTIONAL_TEMPLATE,
      ...template,
      id: `tpl_${Date.now()}`,
      version: 1,
      status: 'DRAFT',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    inMemoryTemplates.push(updated)
  }

  // Audit log
  inMemoryAuditLogs.unshift({
    id: `log_${Date.now()}`,
    templateId: updated.id,
    templateName: updated.name,
    action: 'DRAFT_SAVED',
    version: updated.version,
    actorAdmin: adminName,
    timestamp: new Date().toISOString(),
    notes: `Draft saved for template ${updated.name}.`,
  })

  syncTemplatesToStorage()
  return updated
}

export function publishTemplateVersion(templateId: string, adminName = 'Admin'): PromotionalTemplate | null {
  loadTemplatesFromStorage()
  const target = inMemoryTemplates.find((t) => t.id === templateId)
  if (!target) return null

  // Save current version state to history
  templateHistory.push(JSON.parse(JSON.stringify(target)))

  target.status = 'PUBLISHED'
  target.version += 1
  target.updatedAt = new Date().toISOString()

  inMemoryAuditLogs.unshift({
    id: `log_${Date.now()}`,
    templateId: target.id,
    templateName: target.name,
    action: 'VERSION_PUBLISHED',
    version: target.version,
    actorAdmin: adminName,
    timestamp: new Date().toISOString(),
    notes: `Published version ${target.version} of ${target.name}.`,
  })

  syncTemplatesToStorage()
  return target
}

export function restorePreviousTemplateVersion(templateId: string, adminName = 'Admin'): PromotionalTemplate | null {
  loadTemplatesFromStorage()
  const past = templateHistory.filter((t) => t.id === templateId).pop()
  if (!past) return null

  const existingIdx = inMemoryTemplates.findIndex((t) => t.id === templateId)
  if (existingIdx >= 0) {
    inMemoryTemplates[existingIdx] = {
      ...past,
      version: inMemoryTemplates[existingIdx].version + 1,
      updatedAt: new Date().toISOString(),
    }

    inMemoryAuditLogs.unshift({
      id: `log_${Date.now()}`,
      templateId,
      templateName: past.name,
      action: 'VERSION_RESTORED',
      version: past.version,
      actorAdmin: adminName,
      timestamp: new Date().toISOString(),
      notes: `Restored previous template state from version ${past.version}.`,
    })

    syncTemplatesToStorage()
    return inMemoryTemplates[existingIdx]
  }

  return null
}

export function getTemplateAuditLogs(): TemplateAuditLog[] {
  loadTemplatesFromStorage()
  return [...inMemoryAuditLogs]
}
