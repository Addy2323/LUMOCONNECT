import { MongikePaymentAdapter, MongikePayoutAdapter } from './mongike'
import { MesejiSmsAdapter } from './meseji'
import { SmtpEmailAdapter, S3StorageAdapter } from './mock'
import type { PaymentProvider, PayoutProvider, SmsProvider, EmailProvider, StorageProvider } from './types'

export * from './types'
export * from './mongike'
export * from './meseji'
export * from './mock'

export interface AppProviders {
  payment: PaymentProvider
  payout: PayoutProvider
  sms: SmsProvider
  email: EmailProvider
  storage: StorageProvider
}

export const providers: AppProviders = {
  payment: new MongikePaymentAdapter(),
  payout: new MongikePayoutAdapter(),
  sms: new MesejiSmsAdapter(),
  email: new SmtpEmailAdapter(),
  storage: new S3StorageAdapter(),
}
