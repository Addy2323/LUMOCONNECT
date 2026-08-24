# ADR 0004: Tanzania Tax Withholding & Statement Generation Engine

## Context
Commercial earnings in Tanzania are subject to statutory withholding taxes governed by the Tanzania Revenue Authority (TRA). Commission and advertising income earned by resident individuals is typically subject to 5% withholding at source, while non-residents or corporate entities operate under distinct statutory rules.

## Decision
LUMO includes an effective-dated Tax Engine that:
1. Evaluates Partner tax classification (`INDIVIDUAL_RESIDENT` = 500 bps / 5%, `INDIVIDUAL_NON_RESIDENT` = 1500 bps / 15%, `CORPORATE_REGISTERED` = 0 bps / invoiced).
2. Calculates exact withholding tax before payout batches are compiled.
3. Automatically generates formal, printable, and downloadable **Partner Earnings Statements** with TIN references, transaction itemizations, and TRA compliance disclosures.

## Consequences
- Compliance with Tanzanian tax legislation.
- Partners receive auditable certificates for annual statutory tax declarations.
