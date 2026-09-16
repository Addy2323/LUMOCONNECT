import { providers } from '@/lib/providers'
import type {
  PartnerProfileData,
  BusinessProfileData,
  SecuritySettings,
  OtpChallenge,
  VerificationStatus,
} from './types'

let otpStore: OtpChallenge[] = []

export interface VerificationDocument {
  id: string
  name: string
  type: 'BRELA_CERT' | 'TIN_CERT' | 'TAX_CLEARANCE' | 'ID_PASSPORT' | 'OTHER'
  fileSize: string
  previewUrl?: string // Data URL or object URL for direct visual inspection & download
  status: 'VERIFIED' | 'PENDING' | 'INVALID'
  uploadedAt: string
}

export interface VerificationRecord {
  id: string
  organizationId?: string | null
  userId?: string
  entityType: 'BUSINESS' | 'PARTNER'
  businessName: string
  registrationNumber: string
  tinNumber: string
  industry: string
  contactPerson: string
  email: string
  phone: string
  submittedAt: string
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'MORE_INFO_REQUIRED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
  documents: VerificationDocument[]
  beneficialOwners: string[]
  assignedChecker?: string
  decisionReason?: string
}

// In-memory persistent verification store
const inMemoryVerificationRecords: VerificationRecord[] = []

export function listVerificationRecords(): VerificationRecord[] {
  return [...inMemoryVerificationRecords]
}

export function getVerificationRecordById(id: string): VerificationRecord | undefined {
  return inMemoryVerificationRecords.find((v) => v.id === id)
}

export function submitVerificationRecord(
  data: Omit<VerificationRecord, 'id' | 'submittedAt' | 'status'> & {
    id?: string
    status?: VerificationRecord['status']
  }
): VerificationRecord {
  const existingIdx = inMemoryVerificationRecords.findIndex((v) => v.id === data.id || (v.email && v.email === data.email))
  
  const record: VerificationRecord = {
    id: data.id || `ver_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
    userId: data.userId || 'usr_registered',
    entityType: data.entityType,
    businessName: data.businessName || 'Unnamed Business',
    registrationNumber: data.registrationNumber || 'PENDING',
    tinNumber: data.tinNumber || 'PENDING',
    industry: data.industry || 'General Commerce',
    contactPerson: data.contactPerson || 'Authorized Representative',
    email: data.email || 'user@lumo.co.tz',
    phone: data.phone || '+255 700 000 000',
    submittedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: data.status || 'SUBMITTED',
    documents: data.documents || [],
    beneficialOwners: data.beneficialOwners || [],
    assignedChecker: data.assignedChecker,
    decisionReason: data.decisionReason,
  }

  if (existingIdx >= 0) {
    inMemoryVerificationRecords[existingIdx] = record
  } else {
    inMemoryVerificationRecords.unshift(record)
  }

  return record
}

export function updateVerificationRecordStatus(
  id: string,
  newStatus: VerificationRecord['status'],
  decisionReason: string,
  checkerName: string = 'Super Administrator'
): VerificationRecord | undefined {
  const record = inMemoryVerificationRecords.find((v) => v.id === id)
  if (!record) return undefined

  record.status = newStatus
  record.decisionReason = decisionReason
  record.assignedChecker = checkerName
  return record
}

import { createAndSendOtp, verifyOtpChallenge } from './otp.service'

/**
 * Sends a phone SMS OTP via secure CSPRNG generator & Meseji adapter.
 * Sets 10-minute expiry, 60s cooldown and 3 attempts maximum.
 */
export async function sendPhoneOtp(phone: string): Promise<{ challengeId: string; maskedPhone: string }> {
  const res = await createAndSendOtp({
    identifier: phone,
    purpose: 'REGISTRATION',
  })
  return {
    challengeId: res.challengeId,
    maskedPhone: res.maskedIdentifier,
  }
}

/**
 * Verifies the submitted OTP code against keyed HMAC hash.
 */
export async function verifyPhoneOtp(phone: string, inputCode: string): Promise<{ success: boolean; error?: string }> {
  const res = await verifyOtpChallenge({
    identifier: phone,
    code: inputCode,
  })
  return res
}

/**
 * Default Initial Security Settings (Production dynamic device detection)
 */
export function getInitialSecuritySettings(): SecuritySettings {
  let deviceName = 'Primary Workstation / Device'
  let browserName = 'Secure Web Browser'

  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || ''
    if (ua.includes('Windows NT 10.0') || ua.includes('Windows')) deviceName = 'Windows PC'
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) deviceName = 'Mac'
    else if (ua.includes('iPhone')) deviceName = 'Apple iPhone'
    else if (ua.includes('iPad')) deviceName = 'Apple iPad'
    else if (ua.includes('Android')) deviceName = 'Android Device'
    else if (ua.includes('Linux')) deviceName = 'Linux Workstation'

    if (ua.includes('Edg/')) browserName = 'Microsoft Edge'
    else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browserName = 'Google Chrome'
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browserName = 'Apple Safari'
    else if (ua.includes('Firefox/')) browserName = 'Mozilla Firefox'
  }

  return {
    twoFactorEnabled: true,
    twoFactorMethod: 'SMS_OTP',
    trustedDeviceRegistered: true,
    activeSessions: [
      {
        id: `sess_${Date.now()}`,
        deviceName,
        browser: browserName,
        ipAddress: 'Active Authenticated Session',
        location: 'Current Location',
        isCurrent: true,
        lastActive: new Date(),
      },
    ],
  }
}
