-- Existing paid Partner plans retain access after release. Enterprise/custom plans require explicit grants.
INSERT INTO "subscription_entitlements" ("id", "planId", "code")
SELECT gen_random_uuid(), "id", 'PARTNER_SUBSCRIBER'
FROM "subscription_plans" WHERE "code" IN ('MONTHLY', 'SEMI_ANNUAL') AND "priceMinor" > 0
ON CONFLICT ("planId", "code") DO NOTHING;
