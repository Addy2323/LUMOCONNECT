# LUMO Database Design

**System of Record:** PostgreSQL 16  
**ORM:** Prisma 7 / Prisma Client 6.19.3  
**Schema Location:** `prisma/schema.prisma`

---

## 1. Normalized Entity Models (35+ Models)

### Identity & Authentication
- `User`: Base user record with email, phone, MFA status, account status (`PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `LOCKED`).
- `Account`: OAuth/credentials accounts linked to users.
- `Session`: Database-backed sessions with rotation and revocation support.
- `Verification`: OTP tokens for phone and email verification.
- `PlatformRole`: Platform roles with assigned permission strings.
- `UserRoleAssignment`: Multi-role assignments scoped to organizations.

### Tenancy & Profiles
- `Organization`: Multi-tenant business entities with slug, TIN, and verification status.
- `OrganizationMembership`: Staff roles (`BUSINESS_OWNER`, `BUSINESS_STAFF`, `FINANCE`, `SALES`, `LOGISTICS`).
- `PartnerProfile`: Verified Partner details, social channels, tax classification, and M-Pesa payout preferences.
- `BusinessProfile`: Verified business credentials, TIN, VRN, category, and settlement currency.
- `CustomerProfile`: Optional buyer profiles for direct e-commerce orders.

### Marketplace & Opportunities
- `Opportunity`: Commercial campaigns with budgets, category, geographic region, and partner counts.
- `Deal`: Deal configurations, reward rules, attribution windows, and terms.
- `DealVersion`: Immutable version history of agreed deal terms.
- `RewardRule`: Fixed amount, percentage basis points, tiered structures, or milestone bonuses.
- `Milestone`: Progressive conversion targets with cash bonuses.
- `PartnerApplication`: Applications to join deals with proposal notes.

### Performance & Attribution
- `TrackingLink`: Generated link codes and QR codes with real-time click and unique visitor counters.
- `AttributionTouch`: Recorded user clicks, QR scans, and impressions.
- `AttributionResult`: Explainable attribution calculation records.
- `Lead`: Qualified commercial prospect records.
- `Conversion`: Verified economic events with external references and risk scores.

### Commerce & Financials
- `Order` & `OrderItem`: Customer commercial transactions.
- `Commission`: Individual partner reward records with gross, tax withheld, fee, and net payable.
- `CommissionEvent`: Append-only state transition audit log (`TRACKED` → `PENDING` → `VALIDATING` → `APPROVED` → `PAYABLE` → `PAID`).
- `PaymentAttempt`: Idempotent payment attempts via Mongike or cards.
- `WebhookEvent`: Raw webhook ingress payloads with SHA-256 hashes to prevent replay attacks.
- `Payout` & `PayoutItem`: Bulk mobile-money disbursals with Maker-Checker authorizer user IDs.

### Tax, Risk & Operations
- `TaxRule`: Effective-dated TRA tax withholding rules.
- `EarningsStatement`: Generated monthly partner earnings statements with statement numbers.
- `RiskAlert`: Automated risk scoring flags (`SELF_REFERRAL`, `HIGH_VELOCITY`, `SUSPICIOUS_IP`).
- `Evidence`: File attachments for deal room deliverables and dispute claims.
- `Dispute` & `DisputeMessage`: Multi-party dispute resolution threads.
- `Notification`: In-app, SMS, and email alerts.
- `AuditEvent`: Tamper-evident operational audit logs.

---

## 2. Key Database Conventions
1. **Decimal Safety:** Financial values are stored in integer minor units (`BigInt` / minor units) to avoid floating-point errors.
2. **Append-Only History:** `CommissionEvent` and `AuditEvent` records are append-only. Corrections create adjustment entries rather than overwriting history.
3. **Idempotency:** `PaymentAttempt` and `Payout` records enforce unique `idempotencyKey` constraints.
