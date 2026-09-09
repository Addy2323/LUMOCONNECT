ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deal_nonnegative_capacity" CHECK (
  "maximumPartnerSlots" > 0 AND "availablePartnerSlots" >= 0 AND "availablePartnerSlots" <= "maximumPartnerSlots"
  AND "inventoryTotal" > 0 AND "inventoryAvailable" >= 0 AND "inventoryAvailable" <= "inventoryTotal"
  AND "rewardBudget" > 0 AND "rewardRemaining" >= 0 AND "rewardRemaining" <= "rewardBudget"
  AND "rewardPerVerifiedOutcome" > 0 AND "rewardBudget" >= "rewardPerVerifiedOutcome"
  AND ("dealCapacityType" <> 'ONE_UNIT' OR "inventoryTotal" = 1)
  AND "privateAccessDurationHours" BETWEEN 1 AND 168 AND "disputeWindowHours" >= 24
);
ALTER TABLE "hot_deals" ADD CONSTRAINT "hot_deal_release_window" CHECK (
  ("privateAccessStartAt" IS NULL AND "privateAccessEndsAt" IS NULL AND "partnerReleaseAt" IS NULL)
  OR ("privateAccessStartAt" IS NOT NULL AND "privateAccessEndsAt" IS NOT NULL AND "partnerReleaseAt" IS NOT NULL
    AND "privateAccessEndsAt" = "privateAccessStartAt" + "privateAccessDurationHours" * INTERVAL '1 hour'
    AND "partnerReleaseAt" = "privateAccessEndsAt")
);
ALTER TABLE "hot_deal_funding" ADD CONSTRAINT "hot_deal_positive_funding" CHECK ("amountMinor" > 0);

CREATE FUNCTION lumo_hot_deal_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Hot deal agreements and attribution records are immutable';
END;
$$;
CREATE TRIGGER hot_deal_agreement_immutable BEFORE UPDATE OR DELETE ON "participation_agreement_acceptances"
FOR EACH ROW EXECUTE FUNCTION lumo_hot_deal_immutable();

CREATE FUNCTION lumo_hot_deal_claim_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Referral history cannot be deleted'; END IF;
  IF NEW."dealId" IS DISTINCT FROM OLD."dealId" OR NEW."participationId" IS DISTINCT FROM OLD."participationId"
    OR NEW."customerHash" IS DISTINCT FROM OLD."customerHash" OR NEW."leadId" IS DISTINCT FROM OLD."leadId"
    OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
    OR (OLD."conversionId" IS NOT NULL AND NEW."conversionId" IS DISTINCT FROM OLD."conversionId") THEN
    RAISE EXCEPTION 'Referral attribution cannot be overwritten';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER hot_deal_claim_guard BEFORE UPDATE OR DELETE ON "hot_deal_claims"
FOR EACH ROW EXECUTE FUNCTION lumo_hot_deal_claim_guard();

CREATE FUNCTION lumo_hot_deal_audit_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."entityType" = 'HotDeal' THEN RAISE EXCEPTION 'Hot deal audit history is append-only'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER hot_deal_audit_guard BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION lumo_hot_deal_audit_guard();

CREATE FUNCTION lumo_hot_deal_version_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "participation_agreement_acceptances" WHERE "versionId" = OLD.id) THEN
    RAISE EXCEPTION 'Accepted hot deal terms are immutable; create a new version';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER hot_deal_version_guard BEFORE UPDATE OR DELETE ON "opportunity_versions"
FOR EACH ROW EXECUTE FUNCTION lumo_hot_deal_version_guard();

CREATE INDEX "hot_deal_subscription_active_lookup" ON "user_subscriptions" ("userId", "status", "expiresAt");
