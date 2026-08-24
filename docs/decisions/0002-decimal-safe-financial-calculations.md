# ADR 0002: Decimal-Safe Financial Computations in Minor Units

## Context
LUMO is a commercial performance marketplace where financial calculations (commissions, platform fees, TRA tax withholding, payouts) must be mathematically exact. Floating-point arithmetic in JavaScript (`0.1 + 0.2 !== 0.3`) introduces cumulative rounding errors that are unacceptable in accounting, reconciliation, and statutory tax filings.

## Decision
All monetary values in LUMO are stored, calculated, and transmitted as integer minor units (e.g. 100 minor units per 1 TZS / USD, represented by `BigInt` or integer database columns) with explicit currency codes. Percentage calculations use basis points (bps) where 100 bps = 1.00%, ensuring integer division without floating-point inaccuracies.

## Consequences
- No floating-point inaccuracies during commission calculations or milestone disbursements.
- Explicit formatting utilities (`formatMoney`, `fromMinorUnits`) ensure seamless user interface display.
- Compatible with PostgreSQL `BigInt` / `Decimal` and Prisma ORM.
