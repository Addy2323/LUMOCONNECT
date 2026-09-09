-- CreateEnum
-- Additive migration: existing opportunity, participation and finance records are preserved.
CREATE TYPE "HotDealStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'VERIFIED', 'SCHEDULED_PRIVATE_RELEASE', 'PRIVATE_HOT_DEAL', 'PARTNER_RELEASE', 'FULL', 'PAUSED', 'CANCELLED', 'CLOSED', 'VALIDATING', 'PAYABLE', 'PAID');

-- CreateEnum
CREATE TYPE "DealCapacityType" AS ENUM ('ONE_UNIT', 'MULTI_UNIT', 'UNLIMITED', 'LEAD_LIMIT');

-- CreateTable
CREATE TABLE "subscription_entitlements" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "subscription_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hot_deals" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "accessRule" TEXT NOT NULL DEFAULT 'PRIVATE_MEMBER_EARLY_ACCESS',
    "teaserTitle" TEXT NOT NULL,
    "teaserTitleSw" TEXT,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "privateAccessEnabled" BOOLEAN NOT NULL DEFAULT true,
    "privateAccessStartAt" TIMESTAMP(3),
    "privateAccessEndsAt" TIMESTAMP(3),
    "privateAccessDurationHours" INTEGER NOT NULL DEFAULT 24,
    "partnerReleaseAt" TIMESTAMP(3),
    "generalPartnerAccessEnabled" BOOLEAN NOT NULL DEFAULT true,
    "visibilityStatus" TEXT NOT NULL DEFAULT 'PUBLIC_TEASER',
    "status" "HotDealStatus" NOT NULL DEFAULT 'DRAFT',
    "maximumPartnerSlots" INTEGER NOT NULL,
    "availablePartnerSlots" INTEGER NOT NULL,
    "inventoryTotal" INTEGER NOT NULL,
    "inventoryAvailable" INTEGER NOT NULL,
    "rewardBudget" BIGINT NOT NULL,
    "rewardRemaining" BIGINT NOT NULL,
    "rewardPerVerifiedOutcome" BIGINT NOT NULL,
    "dealCapacityType" "DealCapacityType" NOT NULL,
    "disputeWindowHours" INTEGER NOT NULL DEFAULT 72,
    "ownerEvidenceFileId" UUID NOT NULL,
    "verifiedBy" UUID,
    "verifiedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hot_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hot_deal_funding" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "paymentAttemptId" UUID NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hot_deal_funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participation_agreement_acceptances" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "termsHash" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participation_agreement_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hot_deal_claims" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "customerHash" TEXT NOT NULL,
    "leadId" UUID NOT NULL,
    "conversionId" UUID,
    "evidenceFileIds" UUID[],
    "fraudReviewedBy" UUID,
    "fraudReviewedAt" TIMESTAMP(3),
    "disputeUntil" TIMESTAMP(3),
    "disputed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hot_deal_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hot_deal_materials" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "privateMembersOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "hot_deal_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hot_deal_events" (
    "id" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "hot_deal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hot_deal_preferences" (
    "userId" UUID NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "sms" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "hot_deal_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "hot_deal_saves" (
    "userId" UUID NOT NULL,
    "dealId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hot_deal_saves_pkey" PRIMARY KEY ("userId","dealId")
);

-- CreateIndex
CREATE INDEX "subscription_entitlements_code_idx" ON "subscription_entitlements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_entitlements_planId_code_key" ON "subscription_entitlements"("planId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "hot_deals_opportunityId_key" ON "hot_deals"("opportunityId");

-- CreateIndex
CREATE INDEX "hot_deals_status_partnerReleaseAt_idx" ON "hot_deals"("status", "partnerReleaseAt");

-- CreateIndex
CREATE INDEX "hot_deals_status_privateAccessStartAt_idx" ON "hot_deals"("status", "privateAccessStartAt");

-- CreateIndex
CREATE UNIQUE INDEX "hot_deal_funding_dealId_key" ON "hot_deal_funding"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "hot_deal_funding_paymentAttemptId_key" ON "hot_deal_funding"("paymentAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "participation_agreement_acceptances_participationId_version_key" ON "participation_agreement_acceptances"("participationId", "versionId");

-- CreateIndex
CREATE UNIQUE INDEX "hot_deal_claims_leadId_key" ON "hot_deal_claims"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "hot_deal_claims_conversionId_key" ON "hot_deal_claims"("conversionId");

-- CreateIndex
CREATE INDEX "hot_deal_claims_dealId_disputeUntil_idx" ON "hot_deal_claims"("dealId", "disputeUntil");

-- CreateIndex
CREATE UNIQUE INDEX "hot_deal_claims_dealId_customerHash_key" ON "hot_deal_claims"("dealId", "customerHash");

-- CreateIndex
CREATE INDEX "hot_deal_materials_dealId_idx" ON "hot_deal_materials"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "hot_deal_events_key_key" ON "hot_deal_events"("key");

-- CreateIndex
CREATE INDEX "hot_deal_events_processedAt_createdAt_idx" ON "hot_deal_events"("processedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "subscription_entitlements" ADD CONSTRAINT "subscription_entitlements_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deals_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deals_ownerEvidenceFileId_fkey" FOREIGN KEY ("ownerEvidenceFileId") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deals_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_funding" ADD CONSTRAINT "hot_deal_funding_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "hot_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_funding" ADD CONSTRAINT "hot_deal_funding_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_agreement_acceptances" ADD CONSTRAINT "participation_agreement_acceptances_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "deal_participations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participation_agreement_acceptances" ADD CONSTRAINT "participation_agreement_acceptances_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "opportunity_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_claims" ADD CONSTRAINT "hot_deal_claims_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "hot_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_claims" ADD CONSTRAINT "hot_deal_claims_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "deal_participations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_claims" ADD CONSTRAINT "hot_deal_claims_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_claims" ADD CONSTRAINT "hot_deal_claims_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "conversions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_claims" ADD CONSTRAINT "hot_deal_claims_fraudReviewedBy_fkey" FOREIGN KEY ("fraudReviewedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_materials" ADD CONSTRAINT "hot_deal_materials_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "hot_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_materials" ADD CONSTRAINT "hot_deal_materials_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_events" ADD CONSTRAINT "hot_deal_events_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "hot_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_preferences" ADD CONSTRAINT "hot_deal_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_saves" ADD CONSTRAINT "hot_deal_saves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hot_deal_saves" ADD CONSTRAINT "hot_deal_saves_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "hot_deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
