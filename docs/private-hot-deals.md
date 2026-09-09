# Private Hot Deals and Partner access

This module extends the existing PostgreSQL schema, database sessions, Opportunity/OpportunityVersion, DealParticipation, TrackingAsset, Lead, Conversion, Reward, Dispute, Notification, Payout and JournalEntry models. Existing in-memory marketplace flows are preserved; new deals are never placed in their public data stores.

## Membership pricing

Private Membership has **no configured price or purchase plan yet**. The product specification did not supply a price. A business decision is required before enabling sales of this membership. Existing Partner prices are TZS 25,000/month and TZS 100,000/six months; these prices do not automatically grant Private Member access.

Access comes from `SubscriptionEntitlement.code`, not role names or browser state. Attach `PRIVATE_MEMBER` to the chosen paid plan only after its pricing is agreed. `PARTNER_SUBSCRIBER` grants released-deal access. The migration explicitly maps the existing paid `MONTHLY` and `SEMI_ANNUAL` plans to Partner access; custom and enterprise tiers receive nothing implicitly. On new installations where reference plans are seeded after migration, add these entitlement rows after seeding as well.

The existing subscription checkout uses legacy service state. Its payment adapter must persist server-confirmed `UserSubscription` records before those purchases can grant this module access. LocalStorage or role simulation cannot grant access.

## Data and invariants

`HotDeal` is the access-window and capacity extension of `Opportunity`. Its status is the authoritative visibility/priority lifecycle; no second status column can drift from it. `OpportunityVersion` is the commercial DealVersion. PrivateMemberAccess is derived from active subscriptions and plan entitlements. Referral codes and links share an existing TrackingAsset. HotDealClaim supplies immutable first-customer attribution and fraud-review metadata. HotDealFunding binds a unique successful PaymentAttempt to one deal. Rewards, ledgers and payouts use the existing finance tables.

Default release is start + exactly 86,400,000 milliseconds, stored as UTC timestamps and displayed in Africa/Dar_es_Salaam. An explicit, audited admin configuration may extend an unexpired private window. Paused, full, cancelled, closed or unfunded deals do not open. The server applies the time boundary on protected access as well as through the scheduler; browser countdowns cannot grant access.

Activation uses serializable transactions, a PostgreSQL row lock and bounded retries, including raw-query serialization conflicts. Partner slots are separate from inventory: multiple partners can promote one car, but only one validated sale consumes its unit and reward budget. Every accepted tenancy consumes one unit. Database CHECK constraints prohibit negative capacity or budgets. First customer identity is hashed using a required server secret. The unique `(dealId, customerHash)` constraint prevents attribution replacement, and payment references deduplicate conversions within a deal. Agreement, attribution and HotDeal audit records have database immutability triggers.

Public responses contain an explicit teaser allowlist. Eligible subscribers first receive the agreement preview. Full descriptions, owner identity, referral assets and materials require current agreement acceptance. Each document download rechecks account, subscription, release, capacity, participation and material access. Historical earnings, payout records, statements and dispute submission deliberately remain accessible after subscription expiry. Historical responses exclude owner contacts and confidential documents.

## Routes

All protected routes use the `lumo_db_session` cookie, database account status and same-origin mutation checks. Responses are private/no-store. UUIDs and request bodies are validated. Authentication failures are 401, denied access 403, missing records 404, stale terms/capacity conflicts 409, invalid input 400 and unavailable dependencies 503.

| Route | Purpose |
| --- | --- |
| `GET /api/hot-deals` | Public teasers and server clock |
| `POST /api/hot-deals/submission` | Merchant creation of opportunity, version and review submission in one transaction |
| `POST /api/hot-deals` | Attach access/capacity to an existing database Opportunity |
| `GET /api/hot-deals/:id` | Eligible user's agreement preview |
| `GET /api/hot-deals/:id?room=true` | Accepted Deal Room, referral assets, materials, own leads/rewards and timeline |
| `POST /api/hot-deals/:id` | Discriminated actions below |
| `POST /api/hot-deals/files` | Private PDF/PNG/JPEG upload; 5 MB, bounded request body and hourly user quota |
| `POST /api/hot-deals/:id/evidence` | Attach a private file to the user's historical claim |
| `GET /api/hot-deals/:id/documents/:documentId` | Authorized download proxy |
| `GET /api/hot-deals/admin/files/:fileId` | Audited compliance evidence download |
| `GET /api/hot-deals/account` | Subscription, activations, rewards, payouts, saves and notifications |
| `POST /api/hot-deals/account` | Preferences, or `{action:"save",dealId,saved}` |
| `GET /api/hot-deals/history` | Historical records, printable statements and disputes |
| `GET /api/hot-deals/admin` | Compliance review queue |
| `POST /api/hot-deals/admin` | Approve a private material: `{dealId,fileId,label,privateMembersOnly}` |
| `POST /api/hot-deals/process` | Bearer-authenticated scheduled release and notification processing |
| `POST /api/hot-deals/payment-confirmation` | Signed payment-partner payout outcomes |
| `GET /r/hot/:code` | Validate referral eligibility, record a click and redirect to the protected deal page |

`POST /api/hot-deals/:id` actions:

- `activate`: `accepted:true`, current `versionId` and `termsHash`. Repeated requests return the original participation.
- `lead`: `customerName`, Tanzania `customerPhone`, `consent:true`. A repeat of the same partner/customer returns the original lead; a different partner cannot take it.
- `state`: admin `status`, nonempty `reason` (minimum ten characters), optional `documentIds`. State transitions are allowlisted. Verification requires a real private ownership document, matching terms hash and fixed TZS reward rule.
- `configure`: admin `reason`, optional `ownerEvidenceFileId` (draft/review only), `privateAccessDurationHours`, `visibilityStatus` or `generalPartnerAccessEnabled`. Replacing draft evidence resubmits it for review. Existing accepted terms and attribution are preserved.
- `publish`: admin `startAt` (ISO timestamp with timezone), `paymentAttemptId`, `reason`. Funding must be a successful TZS REWARD_FUNDING payment by this merchant, with a provider reference and enough budget. Simulated/manual funding records are rejected. It cannot reuse another HotDeal's funding payment.
- `validate`: admin `claimId`, `paymentReference`, positive `valueMinor`, private `evidenceFileIds`, `paymentConfirmed:true`, `signedAgreementConfirmed` (required for rentals), `reason`, and `fraudChecks` confirming duplicate-customer, self-referral, device/pattern, collusion, document and merchant checks. Evidence validation allocates the unit/reward and starts the dispute period. Human review is required; these checkboxes are not an automated fraud-detection claim.
- `dispute`: `claimId`, `reason`, optional admin `resolve:true`. The claim gate freezes payout instructions and confirmations. Existing ledger postings and paid records are preserved. Resolution is recorded in the existing dispute and audit tables.
- `approveReward`: a second administrator supplies `claimId`, `taxWithheldMinor`, `platformFeeMinor`, `reason` after the dispute period. Applicable deductions are explicitly reviewed, not newly hard-coded tax advice. Balanced ledger entries are created once, and the reward becomes payable.
- `payout`: a separate finance administrator supplies `claimId`, `payoutMethodId`. Creates an authorized payout instruction/outbox event once. Verified matching payout methods have a 24-hour change hold.

Money request/response fields use integer strings in minor units (TZS × 100). No new endpoint pays for joining or recruitment.

## Payment and notification integration boundaries

No actual funds are transferred by the new module. Publication consumes a server-confirmed existing payment record. Authorized `HOT_DEAL_PAYOUT_INSTRUCTION` outbox events are durable integration points for the approved licensed payment partner. The existing simulated payout adapter is deliberately not invoked. The payment-partner dispatcher and real provider credentials must be connected before live payout operations; an authorized instruction is not reported as a paid reward.

The payout callback body is `{payoutId,providerReference,amountMinor,status:"PAID"|"FAILED"}`. Send `x-lumo-timestamp` as Unix seconds and `x-lumo-signature` as lowercase hex HMAC-SHA256 of `timestamp + "." + exactRawBody`, signed with `HOT_DEALS_PAYMENT_WEBHOOK_SECRET`. Timestamp tolerance is five minutes. References and amounts must match. Repeated confirmations do not duplicate payouts or ledger entries; failures remain recorded for reconciliation.

In-app release notifications are transactional and processed in recipient pages of 200. Preferences default to in-app only. Optional SMS/email delivery uses `HOT_DEALS_NOTIFICATION_GATEWAY` (HTTPS) and `HOT_DEALS_GATEWAY_TOKEN`. The gateway receives channel, recipient, title, body and an `Idempotency-Key` and **must durably deduplicate that key** before provider dispatch. Failed deliveries stay pending. Stale private alerts are suppressed. This adapter boundary can forward to the organization's configured email/SMS providers; the legacy success-simulating adapters are not treated as real delivery. WhatsApp requires a configured channel adapter and is not enabled by this change.

## Deployment

1. Preserve a database backup. For an existing database created with `db push`, compare it with the baseline before running `prisma migrate resolve --applied 20260909000000_baseline`. Do not baseline an incompatible schema. New databases simply run `prisma migrate deploy`. The checked local database matched the baseline and has been migrated additively.
2. Run `prisma generate` and `prisma migrate deploy` in deployment. Never reset the application database.
3. Set independent random secrets (minimum 32 characters): `HOT_DEALS_CRON_SECRET`, `HOT_DEALS_IDENTITY_SECRET`, and `HOT_DEALS_PAYMENT_WEBHOOK_SECRET`. Keep the identity secret stable across deploys; changing it without rehashing existing customer identities weakens duplicate detection.
4. Configure the existing S3 endpoint, bucket, region and credentials. The bucket must have no public read/list access. Documents use signed S3/MinIO requests and an authenticated download proxy; object keys never appear in public APIs. An absolute `HOT_DEALS_PRIVATE_STORAGE_DIR` outside `public/` is supported for a persistent single-host filesystem. Do not use ephemeral local storage on Netlify.
5. Run `npm run hot-deals:worker` under a restarting process supervisor for continuous processing. Netlify deployments also include an every-minute scheduled function calling the authenticated endpoint. Netlify schedules run only on published deployments; verify the function's logs and last successful run after deployment. See [Netlify scheduled function documentation](https://docs.netlify.com/build/functions/scheduled-functions/).
6. Configure optional delivery gateway credentials and the approved payment-partner dispatcher. Test signed callbacks in a PSP sandbox before live use. No provider credentials or live payment changes were made during implementation.
7. Agree Private Membership pricing and connect its paid subscription records/entitlement before advertising a purchasable Private Member tier.

## Development examples and verification

`ALLOW_HOT_DEAL_DEV_SEED=true` with `node --env-file=.env node_modules/tsx/dist/cli.mjs prisma/seed-hot-deals.ts` creates unpublished Toyota Harrier and ten-apartment drafts for an existing development merchant. It never fabricates funded or verified status. Replace ownership placeholders and submit real evidence before review. It does not create fake completed tenancies; the integration test produces seven of ten remaining by validating three separate outcomes.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:hot-deals`, and `npm run build`. The integration runner creates a uniquely named temporary PostgreSQL schema, applies all migrations there and drops only that schema afterward. It never resets or clears the application schema. Lint now uses the supported ESLint CLI: pre-existing rule violations are listed as warnings in `eslint.legacy.mjs`, while the new module retains strict rules. Production build type errors are no longer ignored.

Unit coverage includes exact release boundaries, tier/expiry rules, public allowlists and capacity. PostgreSQL coverage includes agreement/document gates, serializable activation, immutable attribution/audit records, one-car concurrency, ten-apartment allocation, dispute freezing, independent approval and payout/ledger idempotency. Layouts use responsive grids and wrapping controls; automated browser viewport testing has not been run in this environment.
