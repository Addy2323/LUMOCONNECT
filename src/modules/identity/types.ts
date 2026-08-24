import { z } from 'zod'

export type UserRole = 'PARTNER' | 'BUSINESS' | 'ADMIN'

export type VerificationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

export type PartnerType =
  | 'AFFILIATE_CREATOR'
  | 'COMMERCIAL_INTRODUCER'
  | 'B2B_DISTRIBUTOR'
  | 'MARKETING_AGENCY'
  | 'COMMUNITY_LEADER'

export interface PartnerProfileData {
  entityType: 'INDIVIDUAL' | 'COMPANY'
  partnerType: PartnerType
  region: string
  district?: string
  skillsAndIndustries: string[]
  socialChannels: {
    platform: 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'WEBSITE' | 'LINKEDIN' | 'TIKTOK'
    handle: string
    audienceSize?: string
  }[]
  identityType: 'NIDA_ID' | 'PASSPORT' | 'TIN_CERTIFICATE'
  identityNumber: string
  nidaDocumentUrl?: string
  status: VerificationStatus
  reviewNotes?: string
}

export interface BusinessProfileData {
  legalName: string
  tradingName: string
  brelaRegistrationNumber: string
  traTin: string
  businessCategory: string
  registeredAddress: string
  region: string
  authorizedRepName: string
  authorizedRepDesignation: string
  authorizedRepIdNumber: string
  certificateOfIncorporationUrl?: string
  taxClearanceCertificateUrl?: string
  status: VerificationStatus
  reviewNotes?: string
}

export interface SecuritySession {
  id: string
  deviceName: string
  browser: string
  ipAddress: string
  location: string
  isCurrent: boolean
  lastActive: Date
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  twoFactorMethod: 'SMS_OTP' | 'AUTHENTICATOR_APP'
  trustedDeviceRegistered: boolean
  activeSessions: SecuritySession[]
}

export interface OtpChallenge {
  id: string
  identifier: string // Phone or Email
  code: string
  expiresAt: Date
  attemptsRemaining: number
  isUsed: boolean
}
