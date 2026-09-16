import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { DATABASE_SESSION_COOKIE, getDatabaseSession } from '@/lib/database-session'
import { deleteMerchant, inspectMerchantDeletion, MerchantDeletionError } from '@/modules/identity/delete-merchant'
import { cleanupDeletedMerchantFiles } from '@/modules/identity/merchant-file-cleanup'

type Context = { params: Promise<{ id: string }> }
const inputSchema = z.object({ confirmation: z.string().min(1).max(300), reason: z.string().trim().min(5).max(1000), deleteAccounts: z.boolean() })

async function requireAdmin(request: NextRequest) {
  const session = await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value)
  if (!session) throw new MerchantDeletionError('Sign in to continue.', 401)
  if (!session.user.roleAssignments.some(({ role, organizationId }) => !organizationId && ['SUPER_ADMIN', 'ADMIN'].includes(role.code))) {
    throw new MerchantDeletionError('Only platform administrators can delete merchants.', 403)
  }
  return session.userId
}

function failure(error: unknown) {
  if (error instanceof MerchantDeletionError) return NextResponse.json({ message: error.message }, { status: error.status })
  if (error instanceof z.ZodError || error instanceof SyntaxError) return NextResponse.json({ message: 'Enter the merchant name, deletion reason, and account choice.' }, { status: 400 })
  if (error instanceof Prisma.PrismaClientKnownRequestError && ['P2003', 'P2034', 'P2025'].includes(error.code)) {
    return NextResponse.json({ message: 'Deletion could not complete because linked records changed or still require this merchant. Nothing was deleted. Refresh and review the merchant.' }, { status: 409 })
  }
  console.error('Merchant deletion failed', error)
  return NextResponse.json({ message: 'Merchant deletion failed. No partial deletion was saved.' }, { status: 500 })
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const actorId = await requireAdmin(request)
    const { id } = await context.params
    z.string().uuid().parse(id)
    const preview = await inspectMerchantDeletion(db, id, actorId)
    return NextResponse.json({ ...preview, eligibleAccounts: preview.accountIds.length, accountIds: undefined }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return failure(error) }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const actorId = await requireAdmin(request)
    const origin = request.headers.get('origin')
    if (origin && origin !== new URL(request.url).origin) throw new MerchantDeletionError('Cross-origin deletion is not allowed.', 403)
    const { id } = await context.params
    z.string().uuid().parse(id)
    const input = inputSchema.parse(await request.json())
    const result = await deleteMerchant({ ...input, actorId, organizationId: id })
    // Database deletion is committed. A storage outage must not be reported as a rollback.
    const pendingFileCleanup = await cleanupDeletedMerchantFiles(id).catch(() => -1)
    return NextResponse.json({ success: true, ...result, pendingFileCleanup })
  } catch (error) { return failure(error) }
}
