-- Create partial unique indexes for case-insensitive email and canonical phone on active user records
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "User_phone_key";

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_active_key" ON "User" (LOWER("email")) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_active_key" ON "User" ("phone") WHERE "deletedAt" IS NULL AND "phone" IS NOT NULL AND "phone" != '';
