-- AlterTable User add brute-force lockout fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- AlterTable Session add token rotation & tracking fields
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_refreshTokenHash_key" ON "sessions"("refreshTokenHash");
