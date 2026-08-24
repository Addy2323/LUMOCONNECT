# LUMO Database Design & System Architecture

**Platform Owner:** LotusRise Company Limited (Tanzania, East Africa)  
**Governing Principle:** Money follows genuine and independently verifiable economic activity.  
**Architecture:** Modular Monolith with one single authoritative PostgreSQL database  
**Primary Database:** PostgreSQL 16  
**ORM:** Prisma 7 / Prisma Client 6.19.3 (`prisma/schema.prisma`)  

---

## 1. System Database Architecture

```mermaid
flowchart TB
    WEB["Responsive Web App<br/>Admin • Business • Partner"] --> API["Next.js Server Layer<br/>API routes • Server actions"]
    API --> AUTH["Authorization Guard<br/>Session • Role • Tenant • Subscription"]
    AUTH --> DB[("PostgreSQL<br/>Primary system of record")]

    API --> CACHE[("Redis<br/>Rate limits • Cache • Locks")]
    API --> FILES[("Object Storage<br/>KYC • Evidence • Agreements • Creatives")]

    DB --> OUTBOX["Transactional Outbox"]
    OUTBOX --> WORKERS["Background Workers<br/>Attribution • Rewards • Notifications • Payouts"]
    WORKERS --> PROVIDERS["External Providers<br/>Payments • Banks • Mobile Money • SMS • Email"]

    PROVIDERS --> WEBHOOKS["Verified Webhooks"]
    WEBHOOKS --> API

    DB --> ANALYTICS["Materialized Views / Read Replica<br/>Dashboards • Reports • Exports"]
```

> [!IMPORTANT]
> **PostgreSQL remains authoritative.** Redis must never be used as the permanent source for payments, rewards, or subscriptions. All three portals (Admin, Business, Partner) operate on the same unified database with strict role-based and tenant-scoped permissions.

---

## 2. Identity, Business and Marketplace ERD

```mermaid
erDiagram
    USER ||--o| PARTNER_PROFILE : has
    USER ||--o{ ORGANIZATION_MEMBER : joins
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : contains
    USER ||--o{ ROLE_ASSIGNMENT : receives
    ROLE ||--o{ ROLE_ASSIGNMENT : grants

    ORGANIZATION ||--o{ OPPORTUNITY : publishes
    OPPORTUNITY_CATEGORY ||--o{ OPPORTUNITY : classifies
    OPPORTUNITY ||--o{ OPPORTUNITY_VERSION : versions
    OPPORTUNITY_VERSION ||--o{ REWARD_RULE : defines

    USER ||--o{ OPPORTUNITY_APPLICATION : applies
    OPPORTUNITY ||--o{ OPPORTUNITY_APPLICATION : receives
    OPPORTUNITY_APPLICATION o|--o| DEAL_PARTICIPATION : becomes

    USER ||--o{ DEAL_PARTICIPATION : participates
    OPPORTUNITY ||--o{ DEAL_PARTICIPATION : includes
    OPPORTUNITY_VERSION ||--o{ DEAL_PARTICIPATION : locks_terms

    DEAL_PARTICIPATION ||--o{ TRACKING_ASSET : generates
    DEAL_PARTICIPATION ||--o{ LEAD : submits
    DEAL_PARTICIPATION ||--o{ CONVERSION : produces
    TRACKING_ASSET ||--o{ CONVERSION : attributes
    LEAD o|--o| CONVERSION : may_convert
    CONVERSION ||--o{ CONVERSION_EVIDENCE : supported_by

    DEAL_PARTICIPATION ||--o| DEAL_ROOM : opens
    DEAL_ROOM ||--o{ DEAL_MESSAGE : contains
    DEAL_ROOM ||--o{ DEAL_DOCUMENT : stores

    USER {
        uuid id PK
        string email UK
        string phone UK
        string account_status
        datetime created_at
    }

    PARTNER_PROFILE {
        uuid user_id PK
        string verification_status
        string partner_type
        decimal partner_score
    }

    ORGANIZATION {
        uuid id PK
        string legal_name
        string tin
        string verification_status
    }

    ORGANIZATION_MEMBER {
        uuid id PK
        uuid organization_id FK
        uuid user_id FK
        string business_role
        string status
    }

    ROLE {
        uuid id PK
        string code UK
        string scope
    }

    ROLE_ASSIGNMENT {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        uuid organization_id FK
    }

    OPPORTUNITY {
        uuid id PK
        uuid organization_id FK
        uuid category_id FK
        string opportunity_type
        string status
        uuid published_version_id
    }

    OPPORTUNITY_VERSION {
        uuid id PK
        uuid opportunity_id FK
        int version_number
        string terms_hash
        datetime effective_at
    }

    REWARD_RULE {
        uuid id PK
        uuid opportunity_version_id FK
        string reward_type
        bigint amount_minor
        int percentage_bps
    }

    OPPORTUNITY_APPLICATION {
        uuid id PK
        uuid opportunity_id FK
        uuid partner_user_id FK
        string status
        datetime submitted_at
    }

    DEAL_PARTICIPATION {
        uuid id PK
        uuid opportunity_id FK
        uuid partner_user_id FK
        uuid accepted_version_id FK
        string status
    }

    TRACKING_ASSET {
        uuid id PK
        uuid participation_id FK
        string asset_type
        string code UK
        string status
    }

    LEAD {
        uuid id PK
        uuid participation_id FK
        string external_reference
        string validation_status
    }

    CONVERSION {
        uuid id PK
        uuid participation_id FK
        uuid tracking_asset_id FK
        string external_reference
        bigint value_minor
        string status
        datetime occurred_at
    }

    CONVERSION_EVIDENCE {
        uuid id PK
        uuid conversion_id FK
        uuid file_asset_id FK
        string evidence_type
    }
```

> [!NOTE]
> The critical field is `accepted_version_id` in `DEAL_PARTICIPATION`. It locks the exact commercial terms accepted by the Partner even if the Business later publishes an updated Deal version.

---

## 3. Subscription, Reward and Payment ERD

```mermaid
erDiagram
    USER ||--o{ USER_SUBSCRIPTION : purchases
    SUBSCRIPTION_PLAN ||--o{ USER_SUBSCRIPTION : selected_as
    USER_SUBSCRIPTION ||--o{ PAYMENT_ATTEMPT : paid_through
    USER ||--o{ ENTERPRISE_INQUIRY : submits

    ORGANIZATION ||--o| REWARD_FUNDING_ACCOUNT : maintains
    REWARD_FUNDING_ACCOUNT ||--o{ FUNDING_TRANSACTION : records
    PAYMENT_ATTEMPT o|--o| FUNDING_TRANSACTION : may_confirm

    CONVERSION ||--o{ REWARD : generates
    REWARD_RULE ||--o{ REWARD : calculates
    REWARD ||--o{ REWARD_ADJUSTMENT : adjusted_by

    USER ||--o{ PAYOUT_METHOD : owns
    USER ||--o{ PAYOUT : receives
    PAYOUT_METHOD ||--o{ PAYOUT : used_for
    PAYOUT ||--|{ PAYOUT_ITEM : contains
    REWARD ||--o{ PAYOUT_ITEM : settled_through

    JOURNAL_ENTRY ||--|{ JOURNAL_LINE : contains
    LEDGER_ACCOUNT ||--o{ JOURNAL_LINE : posted_to

    RECONCILIATION_RUN ||--o{ RECONCILIATION_ITEM : contains
    PAYMENT_ATTEMPT ||--o{ RECONCILIATION_ITEM : matched_payment
    FUNDING_TRANSACTION ||--o{ RECONCILIATION_ITEM : matched_funding
    PAYOUT ||--o{ RECONCILIATION_ITEM : matched_payout

    SUBSCRIPTION_PLAN {
        uuid id PK
        string code UK
        string name
        string billing_period
        bigint price_minor
        boolean enterprise
    }

    USER_SUBSCRIPTION {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        string status
        datetime starts_at
        datetime expires_at
    }

    PAYMENT_ATTEMPT {
        uuid id PK
        uuid user_id FK
        string purpose
        bigint amount_minor
        string currency
        string provider_reference UK
        string status
    }

    REWARD_FUNDING_ACCOUNT {
        uuid id PK
        uuid organization_id FK
        string provider_account_reference
        string status
    }

    FUNDING_TRANSACTION {
        uuid id PK
        uuid funding_account_id FK
        bigint amount_minor
        string transaction_type
        string provider_reference UK
        string status
    }

    REWARD {
        uuid id PK
        uuid conversion_id FK
        uuid reward_rule_id FK
        uuid partner_user_id FK
        bigint gross_amount_minor
        bigint net_amount_minor
        string status
    }

    REWARD_ADJUSTMENT {
        uuid id PK
        uuid reward_id FK
        bigint amount_minor
        string reason
        string adjustment_type
    }

    PAYOUT {
        uuid id PK
        uuid partner_user_id FK
        uuid payout_method_id FK
        bigint gross_amount_minor
        bigint net_amount_minor
        string provider_reference UK
        string status
    }

    PAYOUT_ITEM {
        uuid id PK
        uuid payout_id FK
        uuid reward_id FK
        bigint allocated_amount_minor
    }

    LEDGER_ACCOUNT {
        uuid id PK
        string account_code UK
        string owner_type
        uuid owner_id
    }

    JOURNAL_ENTRY {
        uuid id PK
        string source_type
        uuid source_id
        datetime posted_at
    }

    JOURNAL_LINE {
        uuid id PK
        uuid journal_entry_id FK
        uuid ledger_account_id FK
        bigint debit_minor
        bigint credit_minor
    }
```

> [!TIP]
> **Double-Entry Balancing Rule:** Every `JOURNAL_ENTRY` must strictly balance:
> $$\sum \text{Debits} = \sum \text{Credits}$$

---

## 4. Verification, Risk, Disputes and Audit ERD

```mermaid
erDiagram
    USER ||--o{ VERIFICATION_CASE : individual_subject
    ORGANIZATION ||--o{ VERIFICATION_CASE : business_subject
    VERIFICATION_CASE ||--o{ VERIFICATION_DOCUMENT : includes
    VERIFICATION_CASE ||--o{ VERIFICATION_DECISION : decided_by

    RISK_RULE ||--o{ RISK_ALERT : generates
    USER ||--o{ RISK_ALERT : user_subject
    CONVERSION ||--o{ RISK_ALERT : conversion_subject
    RISK_ALERT ||--o{ FRAUD_CASE_ALERT : linked_to
    FRAUD_CASE ||--o{ FRAUD_CASE_ALERT : contains

    DEAL_PARTICIPATION ||--o{ DISPUTE : may_raise
    DISPUTE ||--o{ DISPUTE_MESSAGE : contains
    DISPUTE ||--o{ DISPUTE_EVIDENCE : supported_by

    USER ||--o{ AUDIT_LOG : performs
    NOTIFICATION_TEMPLATE ||--o{ NOTIFICATION : generates
    USER ||--o{ NOTIFICATION : receives

    OUTBOX_EVENT ||--o{ WEBHOOK_DELIVERY : dispatches
    WEBHOOK_ENDPOINT ||--o{ WEBHOOK_DELIVERY : receives

    VERIFICATION_CASE {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        string verification_type
        string status
        datetime expires_at
    }

    RISK_ALERT {
        uuid id PK
        uuid rule_id FK
        string subject_type
        uuid subject_id
        decimal risk_score
        string status
    }

    FRAUD_CASE {
        uuid id PK
        string case_number UK
        string priority
        string status
        uuid assigned_to
    }

    DISPUTE {
        uuid id PK
        uuid participation_id FK
        uuid opened_by FK
        string dispute_type
        string status
        datetime due_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid actor_user_id FK
        string action
        string entity_type
        uuid entity_id
        json before_data
        json after_data
        datetime created_at
    }

    OUTBOX_EVENT {
        uuid id PK
        string event_type
        string aggregate_type
        uuid aggregate_id
        json payload
        datetime processed_at
    }
```

---

## 5. Essential Database Rules

1. **Use UUIDv7 or ULID primary keys:** Primary keys are collision-resistant and time-sortable.
2. **Store money as `BIGINT` minor units:** All monetary values are represented as integers (e.g. 10,000 TZS is stored as integer minor units) — never floating-point numbers.
3. **Add `currency`, normally `TZS`, to every financial record:** Explicit currency ensures multi-currency safety for future cross-border scaling.
4. **Every Business-owned record must contain `organization_id`:** Enforces strict multi-tenant isolation at the database and query layers.
5. **Use soft deletion for users, organizations, and published opportunities:** Set `deleted_at` rather than physically removing records.
6. **Never delete payments, rewards, payouts, journal entries, verification decisions, or audit logs:** Immutable audit records ensure financial and legal compliance.
7. **Store documents in object storage; keep only metadata and file references in PostgreSQL:** Files (KYC, evidence, creatives) reside in MinIO/S3 with metadata stored in `FileAsset`.
8. **Encrypt sensitive identification and payout information:** PII and payment credentials are encrypted at rest.
9. **Use idempotency keys for payments, webhooks, conversions, rewards, and payouts:** Prevents duplicate processing during network retries.
10. **Process notifications and provider calls through a transactional outbox:** Outbox pattern guarantees eventual consistency without distributed transaction failure.

---

## 6. Critical Unique Constraints

```text
OrganizationMember:     UNIQUE (organization_id, user_id)
OpportunityVersion:     UNIQUE (opportunity_id, version_number)
OpportunityApplication: UNIQUE (opportunity_id, partner_user_id)
DealParticipation:      UNIQUE (opportunity_id, partner_user_id)
TrackingAsset:          UNIQUE (code)
Conversion:             UNIQUE (organization_id, external_reference)
PaymentAttempt:         UNIQUE (provider_reference)
FundingTransaction:     UNIQUE (provider_reference)
Payout:                 UNIQUE (provider_reference)
Reward:                 UNIQUE (conversion_id, reward_rule_id, partner_user_id)
PayoutItem:             UNIQUE (payout_id, reward_id)
```

