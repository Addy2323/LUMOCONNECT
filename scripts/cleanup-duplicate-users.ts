import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

/**
 * Normalizes phone numbers to standard canonical E.164 format: "+255XXXXXXXXX"
 * Converts empty strings and invalid formats to null.
 */
function normalizeCanonicalPhone(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('255') && digits.length === 12) {
    return `+${digits}`
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+255${digits.slice(1)}`
  }
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    return `+255${digits}`
  }
  if (trimmed.startsWith('+') && digits.length >= 7) {
    return `+${digits}`
  }
  return digits.length >= 7 ? `+${digits}` : null
}

function normalizeCanonicalEmail(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : null
}

async function main() {
  const isApply = process.argv.includes('--apply')
  console.log(`=======================================================`)
  console.log(` LUMO DUPLICATE USER CLEANUP & BACKFILL SCRIPT `)
  console.log(` Mode: ${isApply ? 'REAL APPLY (MUTATING DATABASE)' : 'DRY RUN (AUDIT ONLY)'}`)
  console.log(`=======================================================\n`)

  const users = await db.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Total active user records found: ${users.length}`)

  let backfillCount = 0
  const emailMap = new Map<string, typeof users>()
  const phoneMap = new Map<string, typeof users>()

  for (const u of users) {
    const normEmail = normalizeCanonicalEmail(u.email)
    const normPhone = normalizeCanonicalPhone(u.phone)

    const needsEmailBackfill = normEmail && normEmail !== u.email
    const needsPhoneBackfill = (u.phone === '' && normPhone === null) || (normPhone && normPhone !== u.phone)

    if (needsEmailBackfill || needsPhoneBackfill) {
      backfillCount++
      console.log(`[Backfill Candidate] User ${u.id}: email "${u.email}" -> "${normEmail}", phone "${u.phone}" -> "${normPhone}"`)
      if (isApply) {
        await db.user.update({
          where: { id: u.id },
          data: {
            email: normEmail || u.email,
            phone: normPhone,
          },
        })
      }
    }

    const effectiveEmail = normEmail || u.email.trim().toLowerCase()
    const effectivePhone = normPhone

    if (!emailMap.has(effectiveEmail)) emailMap.set(effectiveEmail, [])
    emailMap.get(effectiveEmail)!.push(u)

    if (effectivePhone) {
      if (!phoneMap.has(effectivePhone)) phoneMap.set(effectivePhone, [])
      phoneMap.get(effectivePhone)!.push(u)
    }
  }

  console.log(`\nBackfilled ${backfillCount} user records with normalized email/phone.`)

  let duplicateEmailGroups = 0
  let duplicatePhoneGroups = 0
  let totalDuplicatesResolved = 0

  // Audit Email Duplicates
  console.log(`\n--- Auditing Duplicate Emails ---`)
  for (const [email, group] of emailMap.entries()) {
    if (group.length > 1) {
      duplicateEmailGroups++
      const primary = group[0]
      const duplicates = group.slice(1)
      console.log(`[Duplicate Email Group] Email: ${email} | Primary ID: ${primary.id} | Duplicates count: ${duplicates.length}`)
      for (const dup of duplicates) {
        console.log(`   └─ Duplicate User: ${dup.id} | Name: "${dup.name}" | Joined: ${dup.createdAt.toISOString()}`)
      }

      if (isApply) {
        for (const dup of duplicates) {
          await mergeAndArchiveDuplicateUser(primary.id, dup.id)
          totalDuplicatesResolved++
        }
      }
    }
  }

  // Audit Phone Duplicates
  console.log(`\n--- Auditing Duplicate Phones ---`)
  for (const [phone, group] of phoneMap.entries()) {
    if (group.length > 1) {
      duplicatePhoneGroups++
      const primary = group[0]
      const duplicates = group.slice(1)
      console.log(`[Duplicate Phone Group] Phone: ${phone} | Primary ID: ${primary.id} | Duplicates count: ${duplicates.length}`)
      for (const dup of duplicates) {
        console.log(`   └─ Duplicate User: ${dup.id} | Name: "${dup.name}" | Joined: ${dup.createdAt.toISOString()}`)
      }

      if (isApply) {
        for (const dup of duplicates) {
          await mergeAndArchiveDuplicateUser(primary.id, dup.id)
          totalDuplicatesResolved++
        }
      }
    }
  }

  console.log(`\n=======================================================`)
  console.log(` CLEANUP SUMMARY`)
  console.log(` Duplicate Email Groups: ${duplicateEmailGroups}`)
  console.log(` Duplicate Phone Groups: ${duplicatePhoneGroups}`)
  console.log(` Total Duplicates ${isApply ? 'Merged & Archived' : 'Identified'}: ${isApply ? totalDuplicatesResolved : emailMap.size + phoneMap.size}`)
  console.log(` Execution Mode: ${isApply ? 'APPLIED TO DATABASE' : 'DRY RUN COMPLETE (Run with --apply to execute)'}`)
  console.log(`=======================================================\n`)
}

async function mergeAndArchiveDuplicateUser(primaryUserId: string, duplicateUserId: string) {
  if (primaryUserId === duplicateUserId) return

  await db.$transaction(async (tx) => {
    // Reassign relational records to primary user
    await tx.session.updateMany({ where: { userId: duplicateUserId }, data: { userId: primaryUserId } })
    await tx.account.updateMany({ where: { userId: duplicateUserId }, data: { userId: primaryUserId } })
    await tx.roleAssignment.updateMany({ where: { userId: duplicateUserId }, data: { userId: primaryUserId } })
    await tx.organizationMember.updateMany({ where: { userId: duplicateUserId }, data: { userId: primaryUserId } })
    await tx.partnerProfile.updateMany({ where: { userId: duplicateUserId }, data: { userId: primaryUserId } }).catch(() => {})
    await tx.userSubscription.updateMany({ where: { userId: duplicateUserId }, data: { userId: primaryUserId } }).catch(() => {})
    await tx.notification.updateMany({ where: { userId: duplicateUserId }, data: { userId: primaryUserId } }).catch(() => {})
    await tx.hotDealSave.updateMany({ where: { userId: duplicateUserId }, data: { userId: primaryUserId } }).catch(() => {})

    // Anonymize duplicate email and clear phone so unique constraints are satisfied
    await tx.user.update({
      where: { id: duplicateUserId },
      data: {
        email: `dup_archived_${duplicateUserId.slice(0, 8)}@lumo.co.tz`,
        phone: null,
        accountStatus: 'SUSPENDED',
        deletedAt: new Date(),
      },
    })

    await tx.auditLog.create({
      data: {
        actorUserId: primaryUserId,
        action: 'DUPLICATE_USER_ACCOUNT_MERGED',
        entityType: 'USER',
        entityId: duplicateUserId,
        afterData: { mergedIntoUserId: primaryUserId },
      },
    }).catch(() => {})
  })
}

main()
  .catch((e) => {
    console.error('Cleanup script error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
