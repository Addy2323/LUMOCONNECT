# Source audit candidates

Source audit snapshot captured on 2026-09-16 before the final deals-repository cleanup. Some listed candidates have since been corrected; see cleanup-status.md. These are review candidates, not evidence that database records can be deleted. This search is not an exhaustive semantic audit of every literal.

## AdminSmsCenterTab.tsx

```text
109: // Fallback in dev/offline
125: // Fallback
```

## AuditLogsTab.tsx

```text
71: <strong>Read-only view:</strong> This screen cannot edit or delete audit records. Cryptographic signatures are not recorded by the current audit store.</span>
```

## ConversionsAttributionTab.tsx

```text
21: import { MOCK_CONVERSIONS } from '../mockData'
27: const [conversions, setConversions] = useState<ConversionRecord[]>(MOCK_CONVERSIONS)
```

## DealApprovalsTab.tsx

```text
26: import { listAdminDeals, updateDealStatus, getVideoEmbedInfo } from '@/modules/deals/service'
43: const all = listAdminDeals() as AdminDealItem[]
```

## DealsRegistryTab.tsx

```text
26: import { listAdminDeals, createDealOpportunity, updateDealStatus, getVideoEmbedInfo } from '@/modules/deals/service'
52: rewardValueTZS: Number(d.rewardDisplay?.replace(/[^0-9]/g, '') || 50000),
53: budgetTZS: d.budgetTZS || 20000000,
54: spentTZS: Math.round((d.budgetTZS || 20000000) * 0.15),
61: setDeals(listAdminDeals() as AdminDealItem[])
64: .catch(() => setDeals(listAdminDeals() as AdminDealItem[]))
79: rewardValueTZS: 50000,
80: budgetTZS: 20000000,
131: baseRewardValue: Number(newDealForm.rewardValueTZS) || 50000,
133: totalBudgetTZS: Number(newDealForm.budgetTZS) || 20000000,
150: rewardValueTZS: 50000,
151: budgetTZS: 20000000,
```

## DisputesComplaintsTab.tsx

```text
16: import { MOCK_DISPUTES } from '../mockData'
23: const [disputes, setDisputes] = useState<DisputeItem[]>(MOCK_DISPUTES)
```

## FinancialReportsRecordsTab.tsx

```text
41: { id: 'customer_payments', name: 'Customer Payment Records', timeline: 'Real-time / Post Payment', count: 142 },
42: { id: 'deal_transactions', name: 'Deal Transaction Records', timeline: 'Real-time', count: 98 },
43: { id: 'revenue', name: 'Platform Revenue Records', timeline: 'Upon Recognition', count: 86 },
44: { id: 'merchant_settlements', name: 'Merchant Settlement Records', timeline: 'At Settlement Creation', count: 54 },
45: { id: 'partner_rewards', name: 'Partner Reward Records', timeline: 'When Deal Confirmed', count: 112 },
46: { id: 'partner_payouts', name: 'Partner Payout Records', timeline: 'Immediately Post Payout', count: 74 },
47: { id: 'subscriptions', name: 'Subscription Payment Records', timeline: 'On Payment / Renewal', count: 230 },
48: { id: 'refunds', name: 'Customer Refund Records', timeline: 'Post Approval / Payment', count: 6 },
49: { id: 'expenses', name: 'Operating Expense Records', timeline: 'Daily / As Incurred', count: 32 },
50: { id: 'tax_records', name: 'Statutory Tax Records (VAT/WHT)', timeline: 'At Transaction Stage', count: 180 },
51: { id: 'bank_mobile_money', name: 'Bank & Mobile Money Records', timeline: 'Real-time / Daily Sync', count: 412 },
52: { id: 'reconciliation', name: 'Reconciliation Records', timeline: 'Daily Close', count: 28 },
53: { id: 'adjustments', name: 'Financial Adjustment Records', timeline: 'Post Approval', count: 5 },
54: { id: 'general_ledger', name: 'General Ledger Journal Entries', timeline: 'Automated Real-time', count: 840 },
55: { id: 'audit_records', name: 'Financial Audit Records', timeline: 'Real-time Immutable', count: 960 },
73: const sampleDeal = {
80: dealValue: 75000000,
81: customerPayment: 75000000,
82: merchantPayable: 68250000,
83: partnerReward: 2250000,
84: lumoGrossRevenue: 4500000,
85: paymentCharges: 450000,
86: lumoNetContribution: 4050000,
132: title: `Deal Financial Economics - ${sampleDeal.dealId}`,
133: subtitle: sampleDeal.dealTitle,
485: TZS {(item * 450000).toLocaleString()}
574: {sampleDeal.dealId}
576: <h3 className="text-base font-black text-slate-900 dark:text-white">{sampleDeal.dealTitle}</h3>
579: Timeline: Posted ({sampleDeal.postedDate}) → Customer Payment ({sampleDeal.customerPaymentDate}) → Closed ({sampleDeal.financiallyClosedDate})
605: TZS {sampleDeal.dealValue.toLocaleString()}
611: TZS {sampleDeal.merchantPayable.toLocaleString()}
617: TZS {sampleDeal.partnerReward.toLocaleString()}
623: TZS {sampleDeal.lumoNetContribution.toLocaleString()}
```

## FraudRiskTab.tsx

```text
18: import { MOCK_FRAUD_ALERTS } from '../mockData'
25: const [cases, setCases] = useState<FraudAlertCase[]>(MOCK_FRAUD_ALERTS)
```

## IntegrationsWebhooksTab.tsx

```text
20: import { MOCK_WEBHOOKS } from '../mockData'
27: const [integrations, setIntegrations] = useState<WebhookIntegration[]>(MOCK_WEBHOOKS)
```

## NotificationsTab.tsx

```text
55: sentCount: 0,
```

## ReconciliationTab.tsx

```text
19: import { MOCK_RECONCILIATION } from '../mockData'
26: const [runs, setRuns] = useState<ReconciliationRun[]>(MOCK_RECONCILIATION)
33: systemTotalTZS: 18450000,
34: providerTotalTZS: 18450000,
65: matchedCount: 142,
```

## RolesPermissionsTab.tsx

```text
26: members: 2,
34: members: 4,
42: members: 3,
50: members: 3,
58: members: 5,
98: members: 0,
158: <strong>Dual-Control Protection:</strong> Assigning powerful roles (Super Admin, Checker) requires two-person approval. Self-promotion is cryptographically blocked by the identity kernel.
```

## SubscriptionsTab.tsx

```text
49: const saved = localStorage.getItem('lumo_admin_sub_ledger')
98: amountPaidTZS: 50000,
122: localStorage.setItem('lumo_admin_sub_ledger', JSON.stringify(sanitized))
165: localStorage.setItem('lumo_admin_sub_ledger', JSON.stringify(newLedger))
192: ? 50000
198: ? 1500000
225: amountPaidTZS: sub.isGoldenVip ? 50000 : 25000,
254: // Local fallback update
342: amountPaidTZS: 50000,
377: amountPaidTZS: 50000,
624: amountPaidTZS: 50000,
```

## SystemSettingsTab.tsx

```text
28: minPayoutTZS: platformConfig.minPayoutTZS || 50000,
29: maxDailyDisbursementTZS: platformConfig.maxDailyDisbursementTZS || 50000000,
41: const historicalVersions = [
72: const handleRestoreVersion = (ver: typeof historicalVersions[0]) => {
320: {historicalVersions.map((ver) => (
```

## TaxStatementsTab.tsx

```text
19: import { MOCK_TAX_RULES } from '../mockData'
26: const [taxRules, setTaxRules] = useState<TaxRuleConfig[]>(MOCK_TAX_RULES)
```

## UsersAccessTab.tsx

```text
23: import { MOCK_USERS } from '../mockData'
29: const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS)
```