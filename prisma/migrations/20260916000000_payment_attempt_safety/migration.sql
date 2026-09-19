ALTER TYPE "PaymentPurpose" ADD VALUE 'ORDER_PAYMENT';
ALTER TABLE "payment_attempts"
  ADD COLUMN "checkoutKey" TEXT,
  ADD COLUMN "phoneHash" TEXT,
  ADD COLUMN "ipHash" TEXT,
  ADD COLUMN "planId" UUID,
  ADD COLUMN "planDays" INTEGER,
  ADD COLUMN "fulfilledSubscriptionId" UUID,
  ADD COLUMN "sourceRoute" TEXT;

ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "payment_attempts_checkoutKey_createdAt_idx" ON "payment_attempts"("checkoutKey", "createdAt");
CREATE INDEX "payment_attempts_phoneHash_createdAt_idx" ON "payment_attempts"("phoneHash", "createdAt");
CREATE INDEX "payment_attempts_ipHash_createdAt_idx" ON "payment_attempts"("ipHash", "createdAt");

CREATE TABLE "payment_webhook_events" (
  "id" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "externalId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "paymentAttemptId" UUID NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_webhook_events_provider_externalId_key" ON "payment_webhook_events"("provider", "externalId");
CREATE INDEX "payment_webhook_events_paymentAttemptId_idx" ON "payment_webhook_events"("paymentAttemptId");
