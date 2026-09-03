import type { PartnerKYCProfile } from './types'

export function calculatePartnerProfileCompletion(profile: PartnerKYCProfile): number {
  const completedFields = [
    profile.fullName.trim().length > 0,
    profile.phoneMasked.trim().length > 0,
    profile.email.trim().length > 0,
    profile.partnerType.trim().length > 0,
    profile.nidaNumberMasked.trim().length > 0,
    profile.tinNumberMasked.trim().length > 0,
    profile.isIdentityVerified,
    profile.region.trim().length > 0,
    profile.channels.length > 0,
    profile.audienceSize.trim().length > 0 && profile.audienceSize.trim() !== '0',
  ].filter(Boolean).length

  return Math.round((completedFields / 10) * 100)
}
