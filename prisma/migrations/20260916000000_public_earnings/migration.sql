ALTER TABLE "partner_profiles" ADD COLUMN "publicEarningsOptOut" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "rewards_status_approvedAt_idx" ON "rewards"("status", "approvedAt");
CREATE TABLE "public_earnings_config" (
  "id" TEXT PRIMARY KEY DEFAULT 'global',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "minimumTZS" INTEGER NOT NULL DEFAULT 0,
  "maximumCards" INTEGER NOT NULL DEFAULT 20,
  "mode" TEXT NOT NULL DEFAULT 'APPROVED',
  "showCategory" BOOLEAN NOT NULL DEFAULT true,
  "showTime" BOOLEAN NOT NULL DEFAULT true,
  "maskDigits" INTEGER NOT NULL DEFAULT 4,
  "secondsPerCard" INTEGER NOT NULL DEFAULT 5
);
