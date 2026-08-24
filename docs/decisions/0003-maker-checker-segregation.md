# ADR 0003: Maker-Checker Segregation of Duties for Financial Disbursements

## Context
In performance commerce and payout orchestration, rogue actors or single compromised administrative accounts could attempt to fabricate payouts or drain balances if a single user could both initiate and disburse funds.

## Decision
LUMO enforces strict Maker-Checker segregation of duties on high-risk actions (`payout.authorize`, `commission.reverse`, `user.suspend`):
1. A **Maker** (e.g. Finance Staff) prepares and bundles eligible commissions into a payout batch.
2. A separate **Checker** (e.g. Admin or Super Admin) must review and authorize the batch.
3. The authorization service explicitly asserts: `if (batch.makerUserId === authorizerUserId) throw new Error('MAKER_CHECKER_VIOLATION')`.

## Consequences
- No single user can prepare and approve their own payout batch.
- All actions are logged with immutable actor and correlation IDs in `AuditEvent`.
