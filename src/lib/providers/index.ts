import { MongikePaymentAdapter, MongikePayoutAdapter } from './mongike'
import { SnippePaymentAdapter } from './snippe'
import { MesejiSmsAdapter } from './meseji'
import { BeemSmsAdapter, BeemOtpAdapter } from './beem'
import { SmtpEmailAdapter, S3StorageAdapter } from './mock'
import type { PaymentProvider, PayoutProvider, SmsProvider, OtpProvider, EmailProvider, StorageProvider } from './types'

export * from './types'
export * from './mongike'
export * from './snippe'
export * from './meseji'
export * from './beem'
export * from './mock'

export interface AppProviders {
  payment: PaymentProvider
  payout: PayoutProvider
  sms: SmsProvider
  otp: OtpProvider
  email: EmailProvider
  storage: StorageProvider
}

export function getActiveSmsProviderName(): 'beem' | 'meseji' {
  const providerEnv = (process.env.SMS_PROVIDER || 'meseji').toLowerCase().trim()
  return providerEnv === 'beem' ? 'beem' : 'meseji'
}

const activeSmsProvider = getActiveSmsProviderName()

export const providers: AppProviders = {
  payment: new SnippePaymentAdapter(),
  payout: new MongikePayoutAdapter(),
  sms: activeSmsProvider === 'beem' ? new BeemSmsAdapter() : new MesejiSmsAdapter(),
  otp: new BeemOtpAdapter(),
  email: new SmtpEmailAdapter(),
  storage: new S3StorageAdapter(),
}
