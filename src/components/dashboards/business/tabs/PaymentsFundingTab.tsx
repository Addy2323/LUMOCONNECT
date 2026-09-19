'use client'
import { BusinessRecords } from '../BusinessRecords'
export function PaymentsFundingTab(_props: { fundingBalance: import('../types').RewardFundingBalance; setFundingBalance: React.Dispatch<React.SetStateAction<import('../types').RewardFundingBalance>> }) {
  return <BusinessRecords kind="payments" title="Partner reward payment records" description="Recorded reward obligations and payment status for your business. Customers pay merchants directly; merchants settle rewards with partners." />
}
