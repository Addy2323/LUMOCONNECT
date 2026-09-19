ALTER TABLE "opportunities" ADD COLUMN "commercialValueMinor" BIGINT;
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_commercial_value_nonnegative" CHECK ("commercialValueMinor" >= 0);
