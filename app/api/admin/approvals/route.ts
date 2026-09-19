import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getDatabaseSession, DATABASE_SESSION_COOKIE } from '@/lib/database-session'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filterStatus = searchParams.get('status') || 'pending'

    // 1. Auto-repair / backfill any opportunities under review without an ApprovalRequest
    const orphanedDeals = await db.opportunity.findMany({
      where: {
        status: { in: ['UNDER_REVIEW', 'SUBMITTED'] },
        deletedAt: null,
        approvalRequests: { none: {} },
      },
      select: {
        id: true,
        createdByUserId: true,
        organizationId: true,
      },
    })

    if (orphanedDeals.length > 0) {
      const fallbackUser = await db.user.findFirst({
        select: { id: true },
      })

      for (const orphan of orphanedDeals) {
        let makerId = orphan.createdByUserId
        if (!makerId) {
          const orgMember = await db.organizationMember.findFirst({
            where: { organizationId: orphan.organizationId },
            select: { userId: true },
          })
          makerId = orgMember?.userId || fallbackUser?.id || null
        }

        if (makerId) {
          await db.approvalRequest.create({
            data: {
              opportunityId: orphan.id,
              makerUserId: makerId,
              approvalStatus: 'PENDING_CHECKER',
              submittedAt: new Date(),
            },
          }).catch(() => {})
        }
      }
    }

    // 2. Build where filter for requests
    let approvalWhere: any = {
      opportunity: {
        deletedAt: null,
      },
    }

    if (filterStatus === 'pending') {
      approvalWhere.approvalStatus = 'PENDING_CHECKER'
    } else if (filterStatus === 'approved') {
      approvalWhere.approvalStatus = 'APPROVED'
    } else if (filterStatus === 'changes_requested') {
      approvalWhere.approvalStatus = 'CHANGES_REQUESTED'
    } else if (filterStatus === 'rejected') {
      approvalWhere.approvalStatus = 'REJECTED'
    } // 'all' leaves approvalStatus unrestricted

    // 3. Query ApprovalRequests with all relations
    const [requests, countAll, countPending, countApproved, countChanges, countRejected] = await Promise.all([
      db.approvalRequest.findMany({
        where: approvalWhere,
        orderBy: { submittedAt: 'desc' },
        include: {
          makerUser: {
            select: { id: true, name: true, email: true },
          },
          checkerUser: {
            select: { id: true, name: true, email: true },
          },
          opportunity: {
            include: {
              organization: {
                select: { id: true, legalName: true, tradingName: true, slug: true, logoUrl: true },
              },
              category: true,
              publishedVersion: {
                include: { rewardRules: true },
              },
              versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1,
                include: { rewardRules: true },
              },
            },
          },
        },
      }),
      db.approvalRequest.count({ where: { opportunity: { deletedAt: null } } }),
      db.approvalRequest.count({ where: { approvalStatus: 'PENDING_CHECKER', opportunity: { deletedAt: null } } }),
      db.approvalRequest.count({ where: { approvalStatus: 'APPROVED', opportunity: { deletedAt: null } } }),
      db.approvalRequest.count({ where: { approvalStatus: 'CHANGES_REQUESTED', opportunity: { deletedAt: null } } }),
      db.approvalRequest.count({ where: { approvalStatus: 'REJECTED', opportunity: { deletedAt: null } } }),
    ])

    const formattedApprovals = requests.map((req) => {
      const opp = req.opportunity
      const activeVersion = opp.publishedVersion ?? opp.versions[0] ?? null
      const primaryRule = activeVersion?.rewardRules?.[0] ?? null

      return {
        id: opp.id,
        approvalRequestId: req.id,
        title: opp.title,
        companyName: opp.organization?.tradingName || opp.organization?.legalName || 'Business',
        organizationId: opp.organizationId,
        type: opp.opportunityType,
        category: opp.category?.name || 'General',
        status: opp.status,
        approvalStatus: req.approvalStatus,
        submittedAt: req.submittedAt.toISOString(),
        reviewedAt: req.reviewedAt ? req.reviewedAt.toISOString() : null,

        // Maker-Checker Info
        makerUser: req.makerUser
          ? { id: req.makerUser.id, name: req.makerUser.name || req.makerUser.email, email: req.makerUser.email }
          : null,
        checkerUser: req.checkerUser
          ? { id: req.checkerUser.id, name: req.checkerUser.name || req.checkerUser.email, email: req.checkerUser.email }
          : null,
        reviewerComments: req.reviewerComments || null,

        // Commercial & multi-currency terms
        currency: opp.currency,
        totalBudgetMinor: opp.totalBudgetMinor ? opp.totalBudgetMinor.toString() : '0',
        budgetTZS: Number(opp.totalBudgetMinor ? opp.totalBudgetMinor / 100n : 0n),
        originalCurrency: opp.originalCurrency || opp.currency,
        originalDealValueMinor: opp.originalDealValueMinor ? opp.originalDealValueMinor.toString() : null,
        referenceCurrency: opp.referenceCurrency || 'TZS',
        referenceValueMinor: opp.referenceValueMinor ? opp.referenceValueMinor.toString() : null,
        exchangeRateUsed: opp.exchangeRateUsed ? Number(opp.exchangeRateUsed) : null,

        // Reward structure
        rewardDisplay: activeVersion?.rewardSummary || opp.rewardDisplayLabel || 'Standard Reward',
        commissionModel: opp.rewardModel || opp.rewardType || 'FIXED_REWARD',
        payoutStructure: opp.payoutCondition || 'ESCROW',
        rewardRule: primaryRule
          ? {
              ruleType: primaryRule.rewardType,
              fixedAmountMinor: primaryRule.amountMinor ? primaryRule.amountMinor.toString() : null,
              percentageBasisPoints: primaryRule.percentageBps,
              currency: primaryRule.currency,
            }
          : null,
        termsHash: activeVersion?.termsHash || null,
        attributionWindowDays: activeVersion?.attributionWindowDays ?? 30,

        // Opportunity Details
        description: opp.description,
        shortDescription: opp.summary,
        bannerUrl: opp.coverImageUrl,
        mediaUrls: opp.galleryImageUrls || [],
        requirements: opp.requirements,
        targetAudience: (opp.requirements as any)?.targetAudience || opp.accessTier || 'All Partners',
        deliverables: opp.successCondition || (opp.requirements as any)?.deliverables || 'Deliver verified conversions',
        contactPersonName: opp.contactPersonName || '',
        contactEmail: opp.contactPersonEmail || '',
        contactPhone: opp.contactPersonPhone || '',
        visibility: opp.visibility || 'PUBLIC',
        featured: opp.isFeatured,
        createdAt: opp.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      approvals: formattedApprovals,
      counts: {
        all: countAll,
        pending: countPending,
        approved: countApproved,
        changes_requested: countChanges,
        rejected: countRejected,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/approvals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    let actorId = (await getDatabaseSession(request.cookies.get(DATABASE_SESSION_COOKIE)?.value))?.userId
    if (!actorId && (process.env.NODE_ENV === 'test' || process.env.VITEST || process.env.ALLOW_TEST_ACTOR === 'true')) {
      actorId = request.headers.get('x-test-actor-id') || undefined
    }

    if (!actorId) {
      return NextResponse.json({ message: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const dealId = body.dealId || body.opportunityId
    const { approvalRequestId, action, notes } = body // action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'

    if (!action || !['APPROVE', 'REQUEST_CHANGES', 'REJECT'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action. Must be APPROVE, REQUEST_CHANGES, or REJECT.' }, { status: 400 })
    }

    // Resolve ApprovalRequest
    let approvalReq: any = null
    if (approvalRequestId) {
      approvalReq = await db.approvalRequest.findUnique({
        where: { id: approvalRequestId },
        include: { opportunity: true },
      })
    } else if (dealId) {
      approvalReq = await db.approvalRequest.findFirst({
        where: {
          opportunityId: dealId,
          approvalStatus: 'PENDING_CHECKER',
        },
        orderBy: { createdAt: 'desc' },
        include: { opportunity: true },
      })
    }

    if (!approvalReq && dealId) {
      // If none found, see if deal exists
      const deal = await db.opportunity.findUnique({ where: { id: dealId } })
      if (!deal) {
        return NextResponse.json({ message: 'Deal not found.' }, { status: 404 })
      }
      // Create pending request
      approvalReq = await db.approvalRequest.create({
        data: {
          opportunityId: deal.id,
          makerUserId: deal.createdByUserId || actorId,
          approvalStatus: 'PENDING_CHECKER',
        },
        include: { opportunity: true },
      })
    }

    if (!approvalReq) {
      return NextResponse.json({ message: 'Approval request not found.' }, { status: 404 })
    }

    // STRICT MAKER-CHECKER SEGREGATION
    // The maker cannot act as checker on their own deal
    if (approvalReq.makerUserId === actorId) {
      return NextResponse.json(
        {
          message:
            'Maker-Checker Policy Violation: A maker cannot approve, request changes, or reject their own deal submission. A separate administrator/checker is required.',
          code: 'MAKER_CHECKER_VIOLATION',
        },
        { status: 403 }
      )
    }

    const opportunityId = approvalReq.opportunityId
    const now = new Date()

    const result = await db.$transaction(async (tx) => {
      let targetApprovalStatus: any = 'APPROVED'
      let targetOppStatus: any = 'PUBLISHED'
      let auditAction = 'ADMIN_DEAL_APPROVED'

      if (action === 'APPROVE') {
        targetApprovalStatus = 'APPROVED'
        targetOppStatus = 'PUBLISHED'
        auditAction = 'ADMIN_DEAL_APPROVED'

        // Resolve or create published version
        let latestVersion = await tx.opportunityVersion.findFirst({
          where: { opportunityId },
          orderBy: { versionNumber: 'desc' },
        })

        if (!latestVersion) {
          const canonicalTerms = JSON.stringify({
            title: approvalReq.opportunity.title,
            description: approvalReq.opportunity.description,
            commissionModel: approvalReq.opportunity.commissionModel,
            payoutStructure: approvalReq.opportunity.payoutStructure,
            totalBudgetMinor: approvalReq.opportunity.totalBudgetMinor?.toString(),
            currency: approvalReq.opportunity.currency,
          })
          const termsHash = crypto.createHash('sha256').update(canonicalTerms).digest('hex')

          latestVersion = await tx.opportunityVersion.create({
            data: {
              opportunityId,
              versionNumber: 1,
              title: approvalReq.opportunity.title,
              description: approvalReq.opportunity.description,
              termsHash,
              rewardSummary: approvalReq.opportunity.rewardSummary || 'Standard Commercial Terms',
              attributionWindowDays: 30,
              attributionModel: 'LAST_CLICK',
              termsAndConditions: 'Standard marketplace terms apply.',
            },
          })
        }

        // Update ApprovalRequest
        await tx.approvalRequest.update({
          where: { id: approvalReq.id },
          data: {
            approvalStatus: targetApprovalStatus,
            checkerUserId: actorId,
            reviewerComments: notes || 'Approved by checker.',
            reviewedAt: now,
          },
        })

        // Update Opportunity
        const updatedOpp = await tx.opportunity.update({
          where: { id: opportunityId },
          data: {
            status: targetOppStatus,
            publishedVersionId: latestVersion.id,
          },
        })

        // Audit Log
        await tx.auditLog.create({
          data: {
            actorUserId: actorId,
            action: auditAction,
            entityType: 'OPPORTUNITY',
            entityId: opportunityId,
            afterData: {
              action,
              notes,
              checkerUserId: actorId,
              makerUserId: approvalReq.makerUserId,
              publishedVersionId: latestVersion.id,
              publishedAt: now,
            },
          },
        })

        return {
          opportunity: {
            id: updatedOpp.id,
            title: updatedOpp.title,
            status: updatedOpp.status,
            publishedVersionId: updatedOpp.publishedVersionId,
          },
          approvalStatus: targetApprovalStatus,
        }
      } else if (action === 'REQUEST_CHANGES') {
        targetApprovalStatus = 'CHANGES_REQUESTED'
        targetOppStatus = 'CHANGES_REQUESTED'
        auditAction = 'ADMIN_DEAL_CHANGES_REQUESTED'

        await tx.approvalRequest.update({
          where: { id: approvalReq.id },
          data: {
            approvalStatus: targetApprovalStatus,
            checkerUserId: actorId,
            reviewerComments: notes || 'Changes requested by checker.',
            reviewedAt: now,
          },
        })

        const updatedOpp = await tx.opportunity.update({
          where: { id: opportunityId },
          data: {
            status: targetOppStatus,
          },
        })

        await tx.auditLog.create({
          data: {
            actorUserId: actorId,
            action: auditAction,
            entityType: 'OPPORTUNITY',
            entityId: opportunityId,
            afterData: {
              action,
              notes,
              checkerUserId: actorId,
              makerUserId: approvalReq.makerUserId,
            },
          },
        })

        return {
          opportunity: {
            id: updatedOpp.id,
            title: updatedOpp.title,
            status: updatedOpp.status,
            publishedVersionId: updatedOpp.publishedVersionId,
          },
          approvalStatus: targetApprovalStatus,
        }
      } else {
        // REJECT
        targetApprovalStatus = 'REJECTED'
        targetOppStatus = 'REJECTED'
        auditAction = 'ADMIN_DEAL_REJECTED'

        await tx.approvalRequest.update({
          where: { id: approvalReq.id },
          data: {
            approvalStatus: targetApprovalStatus,
            checkerUserId: actorId,
            reviewerComments: notes || 'Rejected by checker.',
            reviewedAt: now,
          },
        })

        const updatedOpp = await tx.opportunity.update({
          where: { id: opportunityId },
          data: {
            status: targetOppStatus,
          },
        })

        await tx.auditLog.create({
          data: {
            actorUserId: actorId,
            action: auditAction,
            entityType: 'OPPORTUNITY',
            entityId: opportunityId,
            afterData: {
              action,
              notes,
              checkerUserId: actorId,
              makerUserId: approvalReq.makerUserId,
            },
          },
        })

        return {
          opportunity: {
            id: updatedOpp.id,
            title: updatedOpp.title,
            status: updatedOpp.status,
            publishedVersionId: updatedOpp.publishedVersionId,
          },
          approvalStatus: targetApprovalStatus,
        }
      }
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error('Error in POST /api/admin/approvals:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
