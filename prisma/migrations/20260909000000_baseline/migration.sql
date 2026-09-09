-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('PLATFORM', 'ORGANIZATION');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');

-- CreateEnum
CREATE TYPE "VerificationCaseStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationCaseType" AS ENUM ('INDIVIDUAL_KYC', 'BUSINESS_KYB', 'DOCUMENT_RESUBMISSION');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('PRODUCT_SALES', 'QUALIFIED_LEADS', 'CONTENT_CREATION', 'CUSTOMER_ACQUISITION', 'DISTRIBUTOR_SEARCH', 'B2B_INTRODUCTION', 'REVERSE_SOURCING', 'SUBSCRIPTION_PROMOTION', 'MILESTONE_BOUNTY', 'ADVERTISING_CAMPAIGN');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'RETURNED', 'REJECTED', 'PUBLISHED', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "TrackingAssetType" AS ENUM ('LINK', 'QR_CODE', 'PROMO_CODE', 'API_KEY');

-- CreateEnum
CREATE TYPE "TrackingAssetStatus" AS ENUM ('ACTIVE', 'PAUSED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LeadValidationStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('TRACKED', 'PENDING', 'VALIDATING', 'APPROVED', 'PAYABLE', 'PAID', 'ON_HOLD', 'REJECTED', 'REVERSED', 'DISPUTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('SCREENSHOT', 'RECEIPT', 'INVOICE', 'DELIVERY_PROOF', 'VIDEO', 'API_WEBHOOK', 'MANUAL_ENTRY');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('PERCENTAGE_COMMISSION', 'FIXED_COMMISSION', 'COST_PER_LEAD', 'COST_PER_ACQUISITION', 'FIXED_CAMPAIGN_FEE', 'TIERED_COMMISSION', 'MILESTONE_BONUS', 'HYBRID');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('TRACKED', 'PENDING', 'VALIDATING', 'APPROVED', 'PAYABLE', 'PAID', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('BONUS', 'PENALTY', 'CORRECTION', 'TAX_ADJUSTMENT', 'PLATFORM_FEE', 'REVERSAL');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('SUBSCRIPTION', 'WALLET_TOPUP', 'REWARD_FUNDING', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'INITIATED', 'PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED', 'EXPIRED', 'REVERSED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FundingTransactionType" AS ENUM ('DEPOSIT', 'COMMITMENT', 'RELEASE', 'REFUND', 'FEE_DEDUCTION', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "FundingTransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'AUTHORIZED', 'PROCESSING', 'PAID', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "RiskAlertStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'DISMISSED', 'ESCALATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "FraudCasePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FraudCaseStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED_CONFIRMED', 'RESOLVED_FALSE_POSITIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('CONVERSION_CHALLENGE', 'REWARD_DISPUTE', 'TERMS_DISAGREEMENT', 'PAYMENT_ISSUE', 'PARTNER_CONDUCT');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPENED', 'UNDER_REVIEW', 'EVIDENCE_SUBMITTED', 'RESOLVED_PARTNER_FAVOR', 'RESOLVED_BUSINESS_FAVOR', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "handle" TEXT NOT NULL,
    "bio" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'TZ',
    "region" TEXT,
    "partnerType" TEXT NOT NULL,
    "categories" TEXT[],
    "socialChannels" JSONB,
    "audienceSize" INTEGER,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "partnerScore" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "taxClassification" TEXT NOT NULL DEFAULT 'INDIVIDUAL_RESIDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "RoleScope" NOT NULL DEFAULT 'PLATFORM',
    "description" TEXT,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "organizationId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT,
    "slug" TEXT NOT NULL,
    "tin" TEXT,
    "registrationNumber" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'TZ',
    "logoUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "businessRole" TEXT NOT NULL DEFAULT 'STAFF',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "categoryId" UUID,
    "opportunityType" "OpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "region" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'TZ',
    "coverImageUrl" TEXT,
    "promoVideoUrl" TEXT,
    "galleryImageUrls" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedVersionId" UUID,
    "totalBudgetMinor" BIGINT,
    "spentBudgetMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "maxPartners" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_versions" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "termsHash" TEXT NOT NULL,
    "rewardSummary" TEXT,
    "attributionWindowDays" INTEGER NOT NULL DEFAULT 30,
    "attributionModel" TEXT NOT NULL DEFAULT 'LAST_CLICK',
    "termsAndConditions" TEXT NOT NULL,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_rules" (
    "id" UUID NOT NULL,
    "opportunityVersionId" UUID NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "amountMinor" BIGINT,
    "percentageBps" INTEGER,
    "minQualifyingValueMinor" BIGINT,
    "tierMinCount" INTEGER,
    "tierMaxCount" INTEGER,
    "description" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_applications" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "partnerUserId" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "proposalNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_participations" (
    "id" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "partnerUserId" UUID NOT NULL,
    "acceptedVersionId" UUID NOT NULL,
    "applicationId" UUID,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_assets" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "assetType" "TrackingAssetType" NOT NULL DEFAULT 'LINK',
    "code" TEXT NOT NULL,
    "destinationUrl" TEXT,
    "qrCodeUrl" TEXT,
    "campaignName" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "status" "TrackingAssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "externalReference" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "leadScore" INTEGER NOT NULL DEFAULT 50,
    "validationStatus" "LeadValidationStatus" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB,
    "convertedConversionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversions" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "opportunityId" UUID NOT NULL,
    "trackingAssetId" UUID,
    "externalReference" TEXT,
    "valueMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "status" "ConversionStatus" NOT NULL DEFAULT 'TRACKED',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_evidence" (
    "id" UUID NOT NULL,
    "conversionId" UUID NOT NULL,
    "fileAssetId" UUID,
    "evidenceType" "EvidenceType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_rooms" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_messages" (
    "id" UUID NOT NULL,
    "dealRoomId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_documents" (
    "id" UUID NOT NULL,
    "dealRoomId" UUID NOT NULL,
    "fileAssetId" UUID NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingPeriod" TEXT NOT NULL,
    "priceMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "enterprise" BOOLEAN NOT NULL DEFAULT false,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "paymentMethod" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_inquiries" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "businessName" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "expectedDealVolume" TEXT NOT NULL,
    "aiRequirements" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_funding_accounts" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "providerAccountReference" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_funding_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_transactions" (
    "id" UUID NOT NULL,
    "fundingAccountId" UUID NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "transactionType" "FundingTransactionType" NOT NULL,
    "providerReference" TEXT,
    "paymentAttemptId" UUID,
    "description" TEXT,
    "status" "FundingTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" UUID NOT NULL,
    "conversionId" UUID NOT NULL,
    "rewardRuleId" UUID NOT NULL,
    "partnerUserId" UUID NOT NULL,
    "grossAmountMinor" BIGINT NOT NULL,
    "platformFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "taxWithheldMinor" BIGINT NOT NULL DEFAULT 0,
    "netAmountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "status" "RewardStatus" NOT NULL DEFAULT 'TRACKED',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_adjustments" (
    "id" UUID NOT NULL,
    "rewardId" UUID NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "reason" TEXT NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_methods" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT,
    "branchCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "partnerUserId" UUID NOT NULL,
    "payoutMethodId" UUID NOT NULL,
    "grossAmountMinor" BIGINT NOT NULL,
    "platformFeeMinor" BIGINT NOT NULL DEFAULT 0,
    "taxWithheldMinor" BIGINT NOT NULL DEFAULT 0,
    "netAmountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "providerReference" TEXT,
    "providerBatchRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'DRAFT',
    "authorizedBy" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_items" (
    "id" UUID NOT NULL,
    "payoutId" UUID NOT NULL,
    "rewardId" UUID NOT NULL,
    "allocatedAmountMinor" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_accounts" (
    "id" UUID NOT NULL,
    "accountCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerType" TEXT,
    "ownerId" UUID,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" UUID NOT NULL,
    "narration" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" UUID NOT NULL,
    "journalEntryId" UUID NOT NULL,
    "ledgerAccountId" UUID NOT NULL,
    "debitMinor" BIGINT NOT NULL DEFAULT 0,
    "creditMinor" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TZS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_runs" (
    "id" UUID NOT NULL,
    "runDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "unmatchedCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_items" (
    "id" UUID NOT NULL,
    "reconciliationRunId" UUID NOT NULL,
    "paymentAttemptId" UUID,
    "fundingTransactionId" UUID,
    "payoutId" UUID,
    "matchStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_cases" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "organizationId" UUID,
    "verificationType" "VerificationCaseType" NOT NULL,
    "status" "VerificationCaseStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "fileAssetId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_decisions" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "decidedById" UUID NOT NULL,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_rules" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleLogic" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_alerts" (
    "id" UUID NOT NULL,
    "ruleId" UUID,
    "subjectType" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "userId" UUID,
    "organizationId" UUID,
    "conversionId" UUID,
    "riskScore" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "RiskAlertStatus" NOT NULL DEFAULT 'OPEN',
    "dismissedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_cases" (
    "id" UUID NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "priority" "FraudCasePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "FraudCaseStatus" NOT NULL DEFAULT 'OPEN',
    "assignedTo" UUID,
    "summary" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_case_alerts" (
    "id" UUID NOT NULL,
    "fraudCaseId" UUID NOT NULL,
    "riskAlertId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_case_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "participationId" UUID NOT NULL,
    "openedById" UUID NOT NULL,
    "disputeType" "DisputeType" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPENED',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolutionNotes" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_messages" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_evidence" (
    "id" UUID NOT NULL,
    "disputeId" UUID NOT NULL,
    "fileAssetId" UUID NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID,
    "beforeData" JSONB,
    "afterData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "titleTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "templateId" UUID,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" UUID NOT NULL,
    "uploaderId" UUID NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" UUID NOT NULL,
    "outboxEventId" UUID NOT NULL,
    "endpointId" UUID,
    "httpStatus" INTEGER,
    "responseBody" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_accountStatus_idx" ON "users"("accountStatus");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_value_key" ON "verifications"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "partner_profiles_userId_key" ON "partner_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_profiles_handle_key" ON "partner_profiles"("handle");

-- CreateIndex
CREATE INDEX "partner_profiles_handle_idx" ON "partner_profiles"("handle");

-- CreateIndex
CREATE INDEX "partner_profiles_verificationStatus_idx" ON "partner_profiles"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "role_assignments_userId_idx" ON "role_assignments"("userId");

-- CreateIndex
CREATE INDEX "role_assignments_roleId_idx" ON "role_assignments"("roleId");

-- CreateIndex
CREATE INDEX "role_assignments_organizationId_idx" ON "role_assignments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "role_assignments_userId_roleId_organizationId_key" ON "role_assignments"("userId", "roleId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");

-- CreateIndex
CREATE INDEX "organizations_verificationStatus_idx" ON "organizations"("verificationStatus");

-- CreateIndex
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");

-- CreateIndex
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_categories_name_key" ON "opportunity_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_categories_slug_key" ON "opportunity_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_slug_key" ON "opportunities"("slug");

-- CreateIndex
CREATE INDEX "opportunities_organizationId_idx" ON "opportunities"("organizationId");

-- CreateIndex
CREATE INDEX "opportunities_categoryId_idx" ON "opportunities"("categoryId");

-- CreateIndex
CREATE INDEX "opportunities_opportunityType_idx" ON "opportunities"("opportunityType");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "opportunities_slug_idx" ON "opportunities"("slug");

-- CreateIndex
CREATE INDEX "opportunity_versions_opportunityId_idx" ON "opportunity_versions"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_versions_opportunityId_versionNumber_key" ON "opportunity_versions"("opportunityId", "versionNumber");

-- CreateIndex
CREATE INDEX "reward_rules_opportunityVersionId_idx" ON "reward_rules"("opportunityVersionId");

-- CreateIndex
CREATE INDEX "opportunity_applications_opportunityId_idx" ON "opportunity_applications"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_applications_partnerUserId_idx" ON "opportunity_applications"("partnerUserId");

-- CreateIndex
CREATE INDEX "opportunity_applications_status_idx" ON "opportunity_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_applications_opportunityId_partnerUserId_key" ON "opportunity_applications"("opportunityId", "partnerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "deal_participations_applicationId_key" ON "deal_participations"("applicationId");

-- CreateIndex
CREATE INDEX "deal_participations_opportunityId_idx" ON "deal_participations"("opportunityId");

-- CreateIndex
CREATE INDEX "deal_participations_partnerUserId_idx" ON "deal_participations"("partnerUserId");

-- CreateIndex
CREATE INDEX "deal_participations_acceptedVersionId_idx" ON "deal_participations"("acceptedVersionId");

-- CreateIndex
CREATE INDEX "deal_participations_status_idx" ON "deal_participations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "deal_participations_opportunityId_partnerUserId_key" ON "deal_participations"("opportunityId", "partnerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_assets_code_key" ON "tracking_assets"("code");

-- CreateIndex
CREATE INDEX "tracking_assets_participationId_idx" ON "tracking_assets"("participationId");

-- CreateIndex
CREATE INDEX "tracking_assets_code_idx" ON "tracking_assets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "leads_convertedConversionId_key" ON "leads"("convertedConversionId");

-- CreateIndex
CREATE INDEX "leads_participationId_idx" ON "leads"("participationId");

-- CreateIndex
CREATE INDEX "leads_validationStatus_idx" ON "leads"("validationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "conversions_idempotencyKey_key" ON "conversions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "conversions_participationId_idx" ON "conversions"("participationId");

-- CreateIndex
CREATE INDEX "conversions_opportunityId_idx" ON "conversions"("opportunityId");

-- CreateIndex
CREATE INDEX "conversions_trackingAssetId_idx" ON "conversions"("trackingAssetId");

-- CreateIndex
CREATE INDEX "conversions_status_idx" ON "conversions"("status");

-- CreateIndex
CREATE INDEX "conversions_externalReference_idx" ON "conversions"("externalReference");

-- CreateIndex
CREATE INDEX "conversion_evidence_conversionId_idx" ON "conversion_evidence"("conversionId");

-- CreateIndex
CREATE UNIQUE INDEX "deal_rooms_participationId_key" ON "deal_rooms"("participationId");

-- CreateIndex
CREATE INDEX "deal_messages_dealRoomId_idx" ON "deal_messages"("dealRoomId");

-- CreateIndex
CREATE INDEX "deal_messages_senderId_idx" ON "deal_messages"("senderId");

-- CreateIndex
CREATE INDEX "deal_documents_dealRoomId_idx" ON "deal_documents"("dealRoomId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_idx" ON "user_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "user_subscriptions_planId_idx" ON "user_subscriptions"("planId");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_providerReference_key" ON "payment_attempts"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_idempotencyKey_key" ON "payment_attempts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payment_attempts_userId_idx" ON "payment_attempts"("userId");

-- CreateIndex
CREATE INDEX "payment_attempts_idempotencyKey_idx" ON "payment_attempts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payment_attempts_providerReference_idx" ON "payment_attempts"("providerReference");

-- CreateIndex
CREATE INDEX "payment_attempts_status_idx" ON "payment_attempts"("status");

-- CreateIndex
CREATE INDEX "enterprise_inquiries_userId_idx" ON "enterprise_inquiries"("userId");

-- CreateIndex
CREATE INDEX "enterprise_inquiries_workEmail_idx" ON "enterprise_inquiries"("workEmail");

-- CreateIndex
CREATE INDEX "enterprise_inquiries_status_idx" ON "enterprise_inquiries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reward_funding_accounts_organizationId_key" ON "reward_funding_accounts"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "funding_transactions_providerReference_key" ON "funding_transactions"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "funding_transactions_idempotencyKey_key" ON "funding_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "funding_transactions_fundingAccountId_idx" ON "funding_transactions"("fundingAccountId");

-- CreateIndex
CREATE INDEX "funding_transactions_providerReference_idx" ON "funding_transactions"("providerReference");

-- CreateIndex
CREATE INDEX "funding_transactions_status_idx" ON "funding_transactions"("status");

-- CreateIndex
CREATE INDEX "rewards_conversionId_idx" ON "rewards"("conversionId");

-- CreateIndex
CREATE INDEX "rewards_rewardRuleId_idx" ON "rewards"("rewardRuleId");

-- CreateIndex
CREATE INDEX "rewards_partnerUserId_idx" ON "rewards"("partnerUserId");

-- CreateIndex
CREATE INDEX "rewards_status_idx" ON "rewards"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rewards_conversionId_rewardRuleId_partnerUserId_key" ON "rewards"("conversionId", "rewardRuleId", "partnerUserId");

-- CreateIndex
CREATE INDEX "reward_adjustments_rewardId_idx" ON "reward_adjustments"("rewardId");

-- CreateIndex
CREATE INDEX "payout_methods_userId_idx" ON "payout_methods"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_providerReference_key" ON "payouts"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_idempotencyKey_key" ON "payouts"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payouts_partnerUserId_idx" ON "payouts"("partnerUserId");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "payouts"("status");

-- CreateIndex
CREATE INDEX "payouts_providerReference_idx" ON "payouts"("providerReference");

-- CreateIndex
CREATE INDEX "payout_items_payoutId_idx" ON "payout_items"("payoutId");

-- CreateIndex
CREATE INDEX "payout_items_rewardId_idx" ON "payout_items"("rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "payout_items_payoutId_rewardId_key" ON "payout_items"("payoutId", "rewardId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_accounts_accountCode_key" ON "ledger_accounts"("accountCode");

-- CreateIndex
CREATE INDEX "ledger_accounts_accountCode_idx" ON "ledger_accounts"("accountCode");

-- CreateIndex
CREATE INDEX "ledger_accounts_ownerType_ownerId_idx" ON "ledger_accounts"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "journal_entries_sourceType_sourceId_idx" ON "journal_entries"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "journal_entries_postedAt_idx" ON "journal_entries"("postedAt");

-- CreateIndex
CREATE INDEX "journal_lines_journalEntryId_idx" ON "journal_lines"("journalEntryId");

-- CreateIndex
CREATE INDEX "journal_lines_ledgerAccountId_idx" ON "journal_lines"("ledgerAccountId");

-- CreateIndex
CREATE INDEX "reconciliation_runs_runDate_idx" ON "reconciliation_runs"("runDate");

-- CreateIndex
CREATE INDEX "reconciliation_items_reconciliationRunId_idx" ON "reconciliation_items"("reconciliationRunId");

-- CreateIndex
CREATE INDEX "verification_cases_userId_idx" ON "verification_cases"("userId");

-- CreateIndex
CREATE INDEX "verification_cases_organizationId_idx" ON "verification_cases"("organizationId");

-- CreateIndex
CREATE INDEX "verification_cases_status_idx" ON "verification_cases"("status");

-- CreateIndex
CREATE INDEX "verification_documents_caseId_idx" ON "verification_documents"("caseId");

-- CreateIndex
CREATE INDEX "verification_decisions_caseId_idx" ON "verification_decisions"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "risk_rules_code_key" ON "risk_rules"("code");

-- CreateIndex
CREATE INDEX "risk_alerts_ruleId_idx" ON "risk_alerts"("ruleId");

-- CreateIndex
CREATE INDEX "risk_alerts_subjectType_subjectId_idx" ON "risk_alerts"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "risk_alerts_status_idx" ON "risk_alerts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_cases_caseNumber_key" ON "fraud_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "fraud_cases_caseNumber_idx" ON "fraud_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "fraud_cases_status_idx" ON "fraud_cases"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_case_alerts_fraudCaseId_riskAlertId_key" ON "fraud_case_alerts"("fraudCaseId", "riskAlertId");

-- CreateIndex
CREATE INDEX "disputes_participationId_idx" ON "disputes"("participationId");

-- CreateIndex
CREATE INDEX "disputes_openedById_idx" ON "disputes"("openedById");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "dispute_messages_disputeId_idx" ON "dispute_messages"("disputeId");

-- CreateIndex
CREATE INDEX "dispute_messages_senderId_idx" ON "dispute_messages"("senderId");

-- CreateIndex
CREATE INDEX "dispute_evidence_disputeId_idx" ON "dispute_evidence"("disputeId");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_idx" ON "audit_logs"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_correlationId_idx" ON "audit_logs"("correlationId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "file_assets_fileKey_key" ON "file_assets"("fileKey");

-- CreateIndex
CREATE INDEX "file_assets_uploaderId_idx" ON "file_assets"("uploaderId");

-- CreateIndex
CREATE INDEX "file_assets_fileKey_idx" ON "file_assets"("fileKey");

-- CreateIndex
CREATE INDEX "outbox_events_eventType_idx" ON "outbox_events"("eventType");

-- CreateIndex
CREATE INDEX "outbox_events_processedAt_idx" ON "outbox_events"("processedAt");

-- CreateIndex
CREATE INDEX "outbox_events_createdAt_idx" ON "outbox_events"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_outboxEventId_idx" ON "webhook_deliveries"("outboxEventId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpointId_idx" ON "webhook_deliveries"("endpointId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_profiles" ADD CONSTRAINT "partner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "opportunity_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "opportunity_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_versions" ADD CONSTRAINT "opportunity_versions_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_rules" ADD CONSTRAINT "reward_rules_opportunityVersionId_fkey" FOREIGN KEY ("opportunityVersionId") REFERENCES "opportunity_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_applications" ADD CONSTRAINT "opportunity_applications_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_applications" ADD CONSTRAINT "opportunity_applications_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_participations" ADD CONSTRAINT "deal_participations_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_participations" ADD CONSTRAINT "deal_participations_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_participations" ADD CONSTRAINT "deal_participations_acceptedVersionId_fkey" FOREIGN KEY ("acceptedVersionId") REFERENCES "opportunity_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_participations" ADD CONSTRAINT "deal_participations_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "opportunity_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_assets" ADD CONSTRAINT "tracking_assets_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "deal_participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "deal_participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_convertedConversionId_fkey" FOREIGN KEY ("convertedConversionId") REFERENCES "conversions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "deal_participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_trackingAssetId_fkey" FOREIGN KEY ("trackingAssetId") REFERENCES "tracking_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_evidence" ADD CONSTRAINT "conversion_evidence_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "conversions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_evidence" ADD CONSTRAINT "conversion_evidence_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_rooms" ADD CONSTRAINT "deal_rooms_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "deal_participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_messages" ADD CONSTRAINT "deal_messages_dealRoomId_fkey" FOREIGN KEY ("dealRoomId") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_messages" ADD CONSTRAINT "deal_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_documents" ADD CONSTRAINT "deal_documents_dealRoomId_fkey" FOREIGN KEY ("dealRoomId") REFERENCES "deal_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_documents" ADD CONSTRAINT "deal_documents_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_inquiries" ADD CONSTRAINT "enterprise_inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_funding_accounts" ADD CONSTRAINT "reward_funding_accounts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_transactions" ADD CONSTRAINT "funding_transactions_fundingAccountId_fkey" FOREIGN KEY ("fundingAccountId") REFERENCES "reward_funding_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding_transactions" ADD CONSTRAINT "funding_transactions_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "conversions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_rewardRuleId_fkey" FOREIGN KEY ("rewardRuleId") REFERENCES "reward_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_adjustments" ADD CONSTRAINT "reward_adjustments_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_methods" ADD CONSTRAINT "payout_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payoutMethodId_fkey" FOREIGN KEY ("payoutMethodId") REFERENCES "payout_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_ledgerAccountId_fkey" FOREIGN KEY ("ledgerAccountId") REFERENCES "ledger_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_reconciliationRunId_fkey" FOREIGN KEY ("reconciliationRunId") REFERENCES "reconciliation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_fundingTransactionId_fkey" FOREIGN KEY ("fundingTransactionId") REFERENCES "funding_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_cases" ADD CONSTRAINT "verification_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_cases" ADD CONSTRAINT "verification_cases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_decisions" ADD CONSTRAINT "verification_decisions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "verification_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_decisions" ADD CONSTRAINT "verification_decisions_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "risk_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_alerts" ADD CONSTRAINT "risk_alerts_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "conversions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_cases" ADD CONSTRAINT "fraud_cases_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_case_alerts" ADD CONSTRAINT "fraud_case_alerts_fraudCaseId_fkey" FOREIGN KEY ("fraudCaseId") REFERENCES "fraud_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_case_alerts" ADD CONSTRAINT "fraud_case_alerts_riskAlertId_fkey" FOREIGN KEY ("riskAlertId") REFERENCES "risk_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "deal_participations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_messages" ADD CONSTRAINT "dispute_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_evidence" ADD CONSTRAINT "dispute_evidence_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_assets" ADD CONSTRAINT "file_assets_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_outboxEventId_fkey" FOREIGN KEY ("outboxEventId") REFERENCES "outbox_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "webhook_endpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
