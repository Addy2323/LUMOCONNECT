export interface RiskEvaluationResult {
  riskScore: number // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  flags: string[]
  recommendedAction: 'AUTO_APPROVE' | 'FLAG_FOR_MANUAL_REVIEW' | 'SUSPEND_AND_BLOCK'
}

export function evaluateTransactionRisk({
  partnerId,
  customerIp,
  partnerIp,
  transactionVelocityInLastHour,
  orderValueTZS,
  deviceFingerprintMatchesPartner,
}: {
  partnerId: string
  customerIp?: string
  partnerIp?: string
  transactionVelocityInLastHour: number
  orderValueTZS: number
  deviceFingerprintMatchesPartner?: boolean
}): RiskEvaluationResult {
  let score = 0
  const flags: string[] = []

  // 1. Check self-referral / matching IP or Device
  if (deviceFingerprintMatchesPartner || (customerIp && partnerIp && customerIp === partnerIp)) {
    score += 75
    flags.push('SUSPICIOUS_SELF_REFERRAL_MATCHING_DEVICE_OR_IP')
  }

  // 2. Velocity check (Abnormal conversions per hour)
  if (transactionVelocityInLastHour > 20) {
    score += 50
    flags.push('HIGH_VELOCITY_BURST_TRAFFIC')
  } else if (transactionVelocityInLastHour > 8) {
    score += 25
    flags.push('ELEVATED_VELOCITY')
  }

  // 3. Outlier transaction value
  if (orderValueTZS > 50_000_000) {
    score += 20
    flags.push('UNUSUALLY_LARGE_TRANSACTION_VALUE')
  }

  const riskLevel = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW'
  const recommendedAction =
    riskLevel === 'CRITICAL'
      ? 'SUSPEND_AND_BLOCK'
      : riskLevel === 'HIGH' || riskLevel === 'MEDIUM'
      ? 'FLAG_FOR_MANUAL_REVIEW'
      : 'AUTO_APPROVE'

  return {
    riskScore: Math.min(100, score),
    riskLevel,
    flags,
    recommendedAction,
  }
}
