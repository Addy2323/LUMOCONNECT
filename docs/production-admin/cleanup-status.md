# Admin production cleanup — implementation status

2026-09-16. **NO-GO for declaring the complete master brief production-ready.** This is a source audit and the first implemented cleanup increment, not a completed migration. No production records have been deleted or classified as disposable.

## A. Sidebar audit

Paths below are under `src/components/dashboards/admin/tabs`. “API exists” does not mean its authorization, mapping, or mutations have passed review.

| Section / component | Current source | API / principal Prisma models | Finding and remaining fix | Status |
|---|---|---|---|---|
| Overview | Database | admin/overview; User, Organization, Opportunity, PaymentAttempt, Reward | Gross collections mislabelled revenue; registrations mislabelled activity. Labels corrected; complete period/region consistency remains | Partial |
| UsersAccess | MOCK_USERS then overview | admin/users, admin/overview; User, RoleAssignment, OrganizationMember | Remove sample fallback; secure mutations; actual last activity and account totals | Open |
| BusinessVerification | overview plus identity state | admin/verifications/decision; VerificationCase, VerificationDocument, Organization | Remove optimistic local decisions; enforce authorization and atomic decision/audit | Open |
| DealsRegistry | Database after this increment | admin/deals; Opportunity, OpportunityVersion, DealParticipation | Removed invented reward/budget/spend/version and seeded fallback. Pause/archive persist with a status precondition. Real administrator draft creation remains unavailable | Partial |
| DealApprovals | seeded deals service | admin/approvals exists; Opportunity, OpportunityVersion | Browser-only approval; prechecked checklist; build guarded version-preserving workflow | Open |
| ConversionsAttribution | MOCK_CONVERSIONS | admin/conversions exists; Conversion, ConversionEvidence | Connect actual records and authorized decisions | Open |
| ReferralsCoordination | tickets API | referrals/tickets; ReferralTicket | Audit role scope, polling, lifecycle and durable notifications | Open |
| Subscriptions | API plus localStorage ledger | admin/subscriptions; UserSubscription, SubscriptionPlan | Remove browser authority; partner-only role enforcement and idempotency review | Open |
| Payments | Database after this increment | admin/payments; PaymentAttempt | No samples, invented fees or cosmetic successful refunds. Provider refunds and plan attribution remain unavailable | Partial |
| RewardsPayouts | APIs | admin/payouts, referrals/tickets; Reward, Payout, ReferralTicket | Reconcile permissions, source consistency, lifecycle and events | Open |
| Reconciliation | MOCK_RECONCILIATION | admin/reconciliation exists; inspect persisted run model | Replace samples and simulated runs with provider matching | Open |
| FinancialReportsRecords | embedded records, totals, dates, sample economics | admin/tax is not a full reports service | Implement actual period queries and ledger provenance; no basis for cash/profit claims | Open |
| KycCompliance | identity service | admin/kyc exists; VerificationCase | Remove browser-only decisions and establish secure document access | Open |
| FraudRisk | MOCK_FRAUD_ALERTS | admin/fraud exists; RiskAlert | Persist real cases and review actions | Open |
| DisputesComplaints | MOCK_DISPUTES | admin/disputes exists; Dispute, DisputeMessage | Replace samples and local decisions | Open |
| AuditLogs | Database after this increment | admin/logs; AuditLog | Removed fabricated hash, IP, and actor role; read-only inspection and actual JSON export | Partial; pagination needed |
| Notifications | local templates/actions | admin/notifications exists; Notification | Persist templates, actual delivery and failures; no simulated sends | Open |
| AdminSmsCenter | SMS APIs | admin/sms/*; SMS module | Inspect job/provider persistence, access, sample form defaults and retry behavior | Open |
| ContentPromotions | local state | admin/content exists | Persist content/actions; actual impression tracking | Open |
| AdminPromotionalTemplates | template service | promotional-toolkit/templates | Audit persistence/version publishing across devices; distinguish editor examples from operational records | Open |
| RolesPermissions | embedded roles and member counts | admin/roles exists; Role, RoleAssignment | Use persisted assignments/permissions; remove local-only edits | Open |
| IntegrationsWebhooks | MOCK_WEBHOOKS | admin/integrations exists | Persist integration state; actual delivery history; credential protection | Open |
| SystemSettings | platformConfig plus embedded history | admin/settings exists | Database configuration, version history, guarded mutations | Open |
| Header / profile / health | static role and status claims | no verified health contract | Remove fake uptime, activity and role-switch authority; actual server permissions | Open |

## B. Hardcoded values

See [source inventory](source-inventory.md) for file/line candidates. Removed in this increment: payment sample initialization, 1.5% assumed fee and 98.5% assumed net, 4,875 gateway fallback, synthetic callback timestamps, locally successful refund/verification, sample audit initialization, ID-derived SHA labels, localhost/IP and super-admin audit fallbacks, fixed KYB industry and 1.2 MB document size. Source audit candidates are not a database deletion list.

## C. Files changed

- `app/api/admin/{overview,payments,logs,deals}/route.ts`, `app/api/payments/balance/route.ts`: persisted session gate, truthful mappings.
- `src/lib/admin-session.ts`: rejects client role headers/demo bearer credentials; platform-scoped ADMIN/SUPER_ADMIN only; fails closed on session database failure.
- `src/components/dashboards/admin/{useAdminResource,ResourceStatus}`: polling, error/retry/loading.
- Admin Overview, Payments, AuditLogs tabs and payment types: real data and unavailable values.
- `src/lib/download-records.ts`: actual filtered JSON downloads.
- `tests/unit/admin-production-data.test.ts`: authorization and mapping regression tests.
- `src/lib/providers/snippe.ts`, `tests/unit/gateway-balance.test.ts`: incomplete provider balance responses fail instead of inventing zero balances.

## D–E. Database and API changes

No schema changes, migration, seed, cleanup or production writes. Only five endpoints are secured by the new shared gate in this increment. Other endpoints still require the security review identified above. Existing financial metadata does not record payment processing fees, historical actor roles, cryptographic audit signatures, or reliable payment-to-subscription-tier attribution; these are not inferred.

## F–G. Events, synchronization and cache

Four tabs poll database endpoints every five seconds while visible, refresh on focus/visibility, abort on unmount, and do not overlap requests. Fetches use `no-store`; payment/audit responses are private/no-store. This is polling, not SSE or a completed cross-role event bus. Transactional domain events, ownership-scoped subscriptions and broad producer invalidation remain open.

## H–I. Approvals and versioning

Not implemented in this increment. Existing draft/approval clients use browser services, and the approval API needs transition validation, actor authorization, submitted-version selection, business verification checks, concurrency protection, reason/audit/outbox and protection of accepted terms. Do not claim the existing screen implements these guarantees.

## J–L. Subscriptions, payments and reports

Partner-only subscription enforcement across all entry points still needs review. Payments now show recorded attempts; provider verification/refunds are not simulated. Refund action reports unavailable and changes nothing. Audit/payment exports now download JSON of the current filtered loaded records. Full financial reporting, PDF/Excel and provider refund workflow remain open. The overview displays gross collections, not profit or recognized revenue.

## M. Cleanup report

No live database audit has run. Genuine/test/seed/ambiguous record counts are **unknown**. Retain all records. Source identifiers and sample names alone are insufficient evidence for deletion. A read-only, access-controlled classification report with referential/financial dependencies must precede any cleanup. Duplicate/orphan database audit remains open.

## N–O. Tests and results

Twelve new route tests cover forged credentials, anonymous/business/partner and tenant-scoped role rejection, empty database, exact decimal amount conversion, unavailable fees/verification, truthful audit metadata, query bound, database failure and cross-origin rejection. These passed locally, along with merchant-route, payout-control, gateway-balance and existing Snippe tests: 38 tests across five files. Typecheck passed. Targeted lint has zero errors and 30 warnings (unused imports and existing loose UI types/image usage). No production browser or multi-device tests have been run. Provider balance tests distinguish a genuine zero from missing provider fields; no gateway call was made.

## P. Remaining risks

Most sidebar sections still contain demo/local state. Legacy authentication helpers accept test headers/tokens and several APIs lack guards. Specialized admin role permissions are not yet supported by the new gate. Financial reporting and approval guarantees remain unimplemented. Audit view currently loads at most 1,000 recent records; this is disclosed, not a complete historical export. Payment query needs pagination and separate aggregate queries for scale. Historical activity and missing provider metadata cannot be reconstructed from the current records.

## Q–R. Deployment and rollback

Do not deploy this increment as fulfillment of the complete production brief. No migration is required for the changed code. Validate persisted-session login for real admin accounts in staging; run typecheck, targeted tests and browser checks before rollout. Roll back these code changes with the normal reviewed deployment process if needed; no data restoration is necessary because this increment does not mutate stored data.

## S. Post-deployment checks

Check 401 anonymous / 403 partner and business; admin successful empty and populated responses; true database error and Retry; five-second updates in two sessions; no sample rows after empty responses; exact currency/amount displays; real filtered JSON downloads; gateway failures display unavailable; no payment status change from the unsupported refund action.

## T. Decision

**NO-GO for the complete production cleanup.** The audit exposes substantial remaining implementation work. Passing this increment's tests does not establish the master prompt's forty acceptance checks.
