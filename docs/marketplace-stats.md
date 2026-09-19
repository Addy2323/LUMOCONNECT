# Hero marketplace statistics

The hero reads `GET /api/public/marketplace-stats` immediately and every 30 seconds while visible. Requests do not overlap. Errors hide the panel rather than presenting invented values. The endpoint is uncached, so edits, publication, expiry, cancellation and archival are reflected on the next poll without cache invalidation or a worker.

The value is the sum of `Opportunity.commercialValueMinor` in TZS, divided by 100. The API represents the total as a decimal string to preserve precision. This field is the total commercial value of the opportunity, not a unit price, commission, reward budget or funding balance. No currency conversion is implied. Other currencies are excluded from the sum but their eligible deals still count.

Eligible opportunities must be PUBLISHED, not deleted, belong to a non-deleted organization, have started and not expired. Attached hot deals must additionally be live, verified, PUBLIC_TEASER-visible, and have available inventory and partner slots. Missing commercial values contribute nothing to the sum but still count as deals. Partner count uses active, non-deleted user accounts with partner profiles. Verified outcomes count APPROVED/PAYABLE/PAID conversions on non-deleted opportunities and organizations, across their history. These are conversions, not a count of individual reward rows.

Deploy the migrations with `pnpm exec prisma migrate deploy`, regenerate Prisma, then rebuild and restart. Existing opportunity values remain NULL deliberately: there is no reliable historical commercial value to backfill from reward budgets. Businesses can enter the optional commercial value when creating an opportunity, or use **Set commercial value** in My Opportunities. Authenticated ownership checks protect updates. Values become public aggregates only when the opportunity meets the eligibility rule.

Validation: focused unit tests cover query constraints, exact minor-unit parsing, empty totals, repeated aggregation, compact formatting, aggregate-only responses and failure handling. Browser viewport and live-database integration checks require a running application and migrated database.
