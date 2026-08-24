# LUMO API Contract & Endpoints Specification

All public and integration endpoints are versioned under `/api/v1`. Protected endpoints require valid session authorization, RBAC permission verification, and tenant isolation.

---

## 1. Versioned Route Groups

### Opportunities & Marketplace
- `GET /api/v1/opportunities` — Query, filter, and paginate published deals (supports `query`, `category`, `type`, `region`, `sortBy`).
- `GET /api/v1/opportunities/:id` — Retrieve full opportunity details, milestones, and reward terms.
- `POST /api/v1/opportunities` — Create and publish a new deal (requires `deal.create` permission).
- `POST /api/v1/opportunities/:id/apply` — Partner application and tracking link enrollment.

### Tracking & Ingress
- `POST /api/v1/tracking-links` — Generate unique partner tracking link and QR code.
- `GET /t/:code` — Redirect tracking touchpoint recorder.
- `POST /api/v1/conversions` — Server-to-server conversion webhook ingress with HMAC signature verification.

### Commissions & Payouts
- `GET /api/v1/partner/earnings` — Retrieve partner lifetime, pending, validating, and payable balances.
- `POST /api/v1/commissions/:id/review` — Approve or reject commission conversion (requires `commission.approve`).
- `POST /api/v1/payouts` — Prepare bulk payout batch draft (Maker role).
- `POST /api/v1/payouts/:id/authorize` — Authorize and disburse payout batch via Mongike (Checker role with segregation of duties check).

### Tax & Statements
- `GET /api/v1/partner/statements/:period` — Retrieve or download TRA Withholding Tax Statement.

### Webhooks Ingress
- `POST /api/v1/webhooks/mongike` — Replay-protected Mongike mobile-money collection/payout webhook.
- `POST /api/v1/webhooks/meseji` — Meseji SMS delivery status webhook.
