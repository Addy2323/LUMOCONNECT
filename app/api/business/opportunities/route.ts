import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedBusiness } from '@/lib/business-guard'
import { createHash } from 'crypto'
import { commercialValueSchema } from '@/lib/marketplace-stats'
import { parseBusinessOpportunityInput } from '@/modules/deals/business-opportunity-input'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const biz = await getAuthenticatedBusiness(request)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ALL'
    const search = searchParams.get('search')?.toLowerCase() || ''

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json({
        success: true,
        opportunities: [],
        data: [],
        total: 0,
      })
    }

    const opportunities = await db.opportunity.findMany({
      where: {
        organizationId: biz.businessId,
        deletedAt: null,
        ...(status !== 'ALL' ? { status: status as any } : {}),
      },
      include: {
        category: true,
        publishedVersion: {
          include: { rewardRules: true },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: { rewardRules: true },
        },
        approvalRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            checkerUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        participations: {
          where: { status: 'ACTIVE' },
          select: { id: true, partnerUserId: true },
        },
        referralTickets: {
          select: { id: true, stage: true, rewardStatus: true, rewardAmountTZS: true, rewardDisplay: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const oppTitles = opportunities.map((o) => o.title)
    const oppSlugs = opportunities.map((o) => o.slug).filter(Boolean) as string[]
    const unlinkedTickets = db.referralTicket?.findMany
      ? await db.referralTicket.findMany({
          where: {
            OR: [{ opportunityId: null }],
            AND: [
              {
                OR: [
                  ...(oppTitles.length > 0 ? [{ dealTitle: { in: oppTitles } }] : []),
                  ...(oppSlugs.length > 0 ? [{ dealSlug: { in: oppSlugs } }] : []),
                  { merchantOrgId: biz.businessId },
                ],
              },
            ],
          },
          select: { id: true, dealTitle: true, dealSlug: true, stage: true, rewardStatus: true, rewardAmountTZS: true, rewardDisplay: true },
        })
      : []

    const { extractNumericReward } = await import('@/modules/deals/referral-cases')

    const mapped = opportunities
      .filter((opp) => {
        if (!search) return true
        return (
          opp.title.toLowerCase().includes(search) ||
          opp.summary.toLowerCase().includes(search) ||
          (opp.description && opp.description.toLowerCase().includes(search))
        )
      })
      .map((opp) => {
        const activeVersion = opp.publishedVersion ?? opp.versions[0] ?? null
        const activePartnersCount = new Set((opp.participations || []).map((p: any) => p.partnerUserId)).size

        const matchedUnlinked = unlinkedTickets.filter(
          (t) => t.dealTitle === opp.title || (opp.slug && t.dealSlug === opp.slug)
        )
        const allRelevantTickets = [...(opp.referralTickets || []), ...matchedUnlinked]
        const conversionTickets = allRelevantTickets.filter(
          (t) =>
            ['COMPLETED', 'REWARD_PAID', 'REWARD_APPROVED', 'SUCCESSFUL'].includes(t.stage) ||
            Boolean(t.rewardStatus && ['PARTNER_CONFIRMS_RECEIPT', 'PAID', 'APPROVED'].includes(t.rewardStatus as any))
        )
        const totalConversions = conversionTickets.length

        const ticketPaidAmount = allRelevantTickets
          .filter((t) => t.stage === 'REWARD_PAID' || t.rewardStatus === 'PAID')
          .reduce((sum, t) => sum + extractNumericReward(t.rewardAmountTZS, t.rewardDisplay), 0)

        const budgetTZS = Number(opp.totalBudgetMinor || 0) / 100
        const oppSpent = Number(opp.spentBudgetMinor || 0) / 100
        const spentTZS = Math.max(oppSpent, ticketPaidAmount)
        const latestApproval = opp.approvalRequests[0] ?? null

        let rewardValueTZS = opp.fixedRewardAmountMinor ? Number(opp.fixedRewardAmountMinor) / 100 : 0
        if (!rewardValueTZS && activeVersion?.rewardSummary) {
          const match = activeVersion.rewardSummary.match(/[\d,]+/)
          if (match) {
            rewardValueTZS = parseInt(match[0].replace(/,/g, ''), 10) || 0
          }
        }

        const effectiveRewardDisplay =
          opp.rewardDisplayLabel ||
          activeVersion?.rewardSummary ||
          (rewardValueTZS > 0 ? `TZS ${rewardValueTZS.toLocaleString()}` : 'Terms recorded')

        return {
          id: opp.id,
          slug: opp.slug,
          title: opp.title,
          publicSummary: opp.summary,
          subscriberDescription: opp.description,
          type: opp.opportunityType,
          category: opp.category?.name || 'General',
          subcategory: opp.subcategory || '',
          region: opp.region || 'All Tanzania',
          commercialResult: opp.commercialResultType || 'COMPLETED_SALE',
          commercialResultType: opp.commercialResultType || 'COMPLETED_SALE',
          successCondition: opp.successCondition || '',
          verificationEvidence: opp.verificationEvidence || '',
          verificationWindowDays: opp.verificationWindowDays ?? 14,
          cancellationTerms: opp.cancellationTerms || 'Standard 7 days notice.',
          requirements: opp.requirements,
          documentsRequired: opp.documentsRequired,
          contactPersonName: opp.contactPersonName || '',
          contactPersonPhone: opp.contactPersonPhone || '',
          contactPersonEmail: opp.contactPersonEmail || '',
          closingDate: opp.closingDate ? opp.closingDate.toISOString().split('T')[0] : '',
          visibility: opp.visibility || 'PUBLIC',
          accessTier: opp.accessTier || 'ALL_PARTNERS',
          rewardStructure: opp.rewardModel || 'FIXED_REWARD',
          rewardModel: opp.rewardModel || 'FIXED_REWARD',
          rewardType: opp.rewardType || 'FIXED',
          rewardPercentage: opp.rewardPercentage ? Number(opp.rewardPercentage) : 0,
          rewardValueTZS,
          customRewardDisplay: effectiveRewardDisplay,
          customRewardDetail: opp.rewardTrigger || 'per verified result',
          rewardTrigger: opp.rewardTrigger || 'per verified result',
          payoutCondition: opp.payoutCondition || 'On completion and verification',
          budgetTZS,
          commercialValueTZS: opp.commercialValueMinor === null ? null : Number(opp.commercialValueMinor) / 100,
          originalCurrency: opp.originalCurrency || 'TZS',
          originalDealValue: opp.originalDealValueMinor ? Number(opp.originalDealValueMinor) / 100 : null,
          referenceCurrency: opp.referenceCurrency || 'TZS',
          referenceValue: opp.referenceValueMinor ? Number(opp.referenceValueMinor) / 100 : null,
          spentTZS,
          status: opp.status,
          version: activeVersion ? activeVersion.versionNumber : 1,
          activePartners: activePartnersCount,
          totalConversions,
          trackingMethod: 'PROMO_CODE',
          startDate: opp.startDate ? opp.startDate.toISOString().split('T')[0] : 'Open Access',
          endDate: opp.endDate ? opp.endDate.toISOString().split('T')[0] : 'Open Access',
          attributionWindowDays: activeVersion?.attributionWindowDays || 30,
          partnerDeliverables: opp.description,
          evidenceRequired: opp.verificationEvidence || activeVersion?.termsAndConditions || '',
          coverImageUrl: opp.coverImageUrl || undefined,
          promoVideoUrl: opp.promoVideoUrl || undefined,
          galleryImageUrls: opp.galleryImageUrls || [],
          createdAt: opp.createdAt.toISOString().split('T')[0],
          updatedAt: opp.updatedAt.toISOString().split('T')[0],
          approvalStatus: latestApproval?.approvalStatus ?? (opp.status === 'UNDER_REVIEW' ? 'PENDING_CHECKER' : opp.status),
          adminComments: latestApproval?.reviewerComments || null,
          approvalHistory: opp.approvalRequests.map((a) => ({
            id: a.id,
            status: a.approvalStatus,
            comments: a.reviewerComments,
            submittedAt: a.submittedAt.toISOString(),
            reviewedAt: a.reviewedAt?.toISOString() || null,
            checkerName: a.checkerUser?.name || 'Compliance Checker',
          })),
        }
      })

    return NextResponse.json({
      success: true,
      opportunities: mapped,
      data: mapped,
      total: mapped.length,
    })
  } catch (error: any) {
    console.error('List business opportunities error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const biz = await getAuthenticatedBusiness(request)
    const rawBody = await request.json().catch(() => ({}))
    const body = { ...rawBody, ...parseBusinessOpportunityInput(rawBody) }

    const {
      draftId,
      id,
      title,
      type = 'CUSTOMER_ACQUISITION',
      category = 'General',
      subcategory = '',
      region = 'All Tanzania',
      publicSummary,
      subscriberDescription,
      rewardStructure = 'FIXED_REWARD',
      rewardModel,
      rewardType = 'FIXED',
      rewardValueTZS = 0,
      rewardPercent = 0,
      customRewardDisplay,
      customRewardDetail,
      customFormulaDescription,
      estimatedBudgetTZS = 0,
      attributionWindowDays = 30,
      partnerDeliverables,
      evidenceRequired,
      cancellationTerms,
      coverImageUrl,
      promoVideoUrl,
      galleryImageUrls = [],
      status = 'UNDER_REVIEW',
      commercialResult,
      commercialResultType,
      successCondition,
      verificationEvidence,
      verificationWindowDays = 14,
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail,
      closingDate,
      visibility = 'PUBLIC',
      accessTier = 'ALL_PARTNERS',
      requirements,
      documentsRequired,
      originalCurrency = 'TZS',
      originalDealValue = null,
      referenceCurrency = 'TZS',
      referenceValue = null,
      exchangeRateUsed = null,
    } = body

    const targetOpportunityId = draftId || id || null

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Opportunity title is required.' },
        { status: 400 }
      )
    }

    const effectiveStatus = (status === 'SUBMITTED' ? 'UNDER_REVIEW' : status) as any
    const commercialValue = commercialValueSchema.safeParse(body.commercialValueTZS)
    if (!commercialValue.success) return NextResponse.json({ error: 'Invalid commercial deal value' }, { status: 400 })
    const totalBudgetMinor = BigInt(Math.round(Number(estimatedBudgetTZS || 0) * 100))
    const fixedRewardMinor = BigInt(Math.round(Number(rewardValueTZS || 0) * 100))
    const origDealValueMinor = originalDealValue ? BigInt(Math.round(Number(originalDealValue) * 100)) : null
    const refValueMinor = referenceValue ? BigInt(Math.round(Number(referenceValue) * 100)) : commercialValue.data

    const effectiveRewardDisplay =
      customRewardDisplay ||
      (rewardValueTZS > 0
        ? `TZS ${Number(rewardValueTZS).toLocaleString()} ${customRewardDetail || 'per verified outcome'}`
        : `${rewardPercent}% commission`)

    const termsHash = createHash('sha256')
      .update(`${title}|${rewardValueTZS}|${attributionWindowDays}|${Date.now()}`)
      .digest('hex')

    // Find or resolve category ID if possible
    let categoryRecord = null
    if (db.opportunityCategory?.findFirst) {
      categoryRecord = await db.opportunityCategory.findFirst({
        where: {
          OR: [{ name: { equals: category, mode: 'insensitive' } }, { slug: { equals: category.toLowerCase().replace(/[^a-z0-9]/g, '-') } }],
        },
      })

      if (!categoryRecord && category && db.opportunityCategory?.create) {
        try {
          categoryRecord = await db.opportunityCategory.create({
            data: {
              name: category,
              slug: `${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`,
              description: `${category} Opportunities`,
            },
          })
        } catch {
          // ignore concurrent collision
        }
      }
    }

    let opportunityRecord: any

    const runInTx = async <T>(fn: (tx: any) => Promise<T>): Promise<T> => {
      if (typeof (db as any).$transaction === 'function') {
        return (db as any).$transaction(fn)
      }
      return fn(db)
    }

    if (targetOpportunityId) {
      // Update existing draft / opportunity
      const existing = await db.opportunity?.findFirst?.({
        where: { id: targetOpportunityId, organizationId: biz.businessId, deletedAt: null },
      })

      if (existing) {
        opportunityRecord = await runInTx(async (tx) => {
          const updated = await tx.opportunity.update({
            where: { id: existing.id },
            data: {
              title: title.trim(),
              opportunityType: type as any,
              categoryId: categoryRecord?.id || existing.categoryId,
              subcategory,
              summary: publicSummary || title.trim(),
              description: subscriberDescription || publicSummary || title.trim(),
              region,
              coverImageUrl: coverImageUrl || null,
              promoVideoUrl: promoVideoUrl || null,
              galleryImageUrls: Array.isArray(galleryImageUrls) ? galleryImageUrls : [],
              totalBudgetMinor,
              commercialValueMinor: commercialValue.data,
              currency: referenceCurrency || 'TZS',
              status: effectiveStatus,
              contactPersonName,
              contactPersonPhone,
              contactPersonEmail,
              closingDate: closingDate ? new Date(closingDate) : null,
              visibility,
              accessTier,
              requirements: requirements ? (typeof requirements === 'object' ? requirements : JSON.parse(requirements)) : null,
              documentsRequired: documentsRequired ? (typeof documentsRequired === 'object' ? documentsRequired : JSON.parse(documentsRequired)) : null,
              commercialResultType: commercialResultType || commercialResult || 'COMPLETED_SALE',
              successCondition: successCondition || 'Verified performance outcome.',
              verificationEvidence: verificationEvidence || evidenceRequired || 'Proof of signed agreement or order completion.',
              verificationWindowDays: Number(verificationWindowDays) || 14,
              cancellationTerms: cancellationTerms || '7 days written notice.',
              rewardModel: rewardModel || rewardStructure,
              rewardType,
              rewardPercentage: rewardPercent ? Number(rewardPercent) : null,
              fixedRewardAmountMinor: fixedRewardMinor,
              rewardDisplayLabel: effectiveRewardDisplay,
              rewardTrigger: customRewardDetail || 'per verified result',
              payoutCondition: customFormulaDescription || 'Standard settlement upon verified outcome.',
              securedBudgetMinor: totalBudgetMinor,
              originalCurrency,
              originalDealValueMinor: origDealValueMinor,
              referenceCurrency,
              referenceValueMinor: refValueMinor,
              exchangeRateUsed: exchangeRateUsed ? Number(exchangeRateUsed) : null,
              exchangeRateDate: exchangeRateUsed ? new Date() : null,
            },
          })

          // Update or create initial version
          if (tx.opportunityVersion?.findFirst) {
            const version = await tx.opportunityVersion.findFirst({
              where: { opportunityId: updated.id },
              orderBy: { versionNumber: 'desc' },
            })

            if (version && tx.opportunityVersion?.update) {
              await tx.opportunityVersion.update({
                where: { id: version.id },
                data: {
                  title: updated.title,
                  description: updated.description,
                  rewardSummary: effectiveRewardDisplay,
                  termsAndConditions: cancellationTerms || evidenceRequired || 'Standard terms apply.',
                  attributionWindowDays: Number(attributionWindowDays) || 30,
                },
              })
            } else if (tx.opportunityVersion?.create) {
              await tx.opportunityVersion.create({
                data: {
                  opportunityId: updated.id,
                  versionNumber: 1,
                  title: updated.title,
                  description: updated.description,
                  termsHash,
                  rewardSummary: effectiveRewardDisplay,
                  attributionWindowDays: Number(attributionWindowDays) || 30,
                  termsAndConditions: cancellationTerms || evidenceRequired || 'Standard terms apply.',
                  isExclusive: false,
                  requiresApproval: true,
                },
              })
            }
          }

          // If submitted for review, create ApprovalRequest if none pending
          if (effectiveStatus === 'UNDER_REVIEW' && tx.approvalRequest?.findFirst && tx.approvalRequest?.create) {
            const pendingApproval = await tx.approvalRequest.findFirst({
              where: { opportunityId: updated.id, approvalStatus: 'PENDING_CHECKER' },
            })
            if (!pendingApproval) {
              await tx.approvalRequest.create({
                data: {
                  opportunityId: updated.id,
                  makerUserId: biz.userId,
                  approvalStatus: 'PENDING_CHECKER',
                  submittedAt: new Date(),
                },
              }).catch(() => {})
            }
          }

          if (tx.auditLog?.create) {
            await tx.auditLog.create({
              data: {
                actorUserId: biz.userId,
                action: effectiveStatus === 'UNDER_REVIEW' ? 'OPPORTUNITY_SUBMITTED' : 'OPPORTUNITY_DRAFT_UPDATED',
                entityType: 'OPPORTUNITY',
                entityId: updated.id,
                afterData: { status: effectiveStatus, title: updated.title },
              },
            }).catch(() => {})
          }

          return updated
        })
      }
    }

    if (!opportunityRecord) {
      // Create fresh Opportunity record
      const slug = `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-6)}`

      opportunityRecord = await runInTx(async (tx) => {
        const created = await tx.opportunity.create({
          data: {
            organizationId: biz.businessId,
            createdByUserId: biz.userId,
            categoryId: categoryRecord?.id || null,
            subcategory,
            title: title.trim(),
            slug,
            opportunityType: type as any,
            summary: publicSummary || title.trim(),
            description: subscriberDescription || publicSummary || title.trim(),
            region,
            coverImageUrl: coverImageUrl || null,
            promoVideoUrl: promoVideoUrl || null,
            galleryImageUrls: Array.isArray(galleryImageUrls) ? galleryImageUrls : [],
            totalBudgetMinor,
            commercialValueMinor: commercialValue.data,
            spentBudgetMinor: BigInt(0),
            currency: referenceCurrency || 'TZS',
            status: effectiveStatus,
            contactPersonName,
            contactPersonPhone,
            contactPersonEmail,
            closingDate: closingDate ? new Date(closingDate) : null,
            visibility,
            accessTier,
            requirements: requirements ? (typeof requirements === 'object' ? requirements : JSON.parse(requirements)) : null,
            documentsRequired: documentsRequired ? (typeof documentsRequired === 'object' ? documentsRequired : JSON.parse(documentsRequired)) : null,
            commercialResultType: commercialResultType || commercialResult || 'COMPLETED_SALE',
            successCondition: successCondition || 'Verified performance outcome.',
            verificationEvidence: verificationEvidence || evidenceRequired || 'Proof of signed agreement or order completion.',
            verificationWindowDays: Number(verificationWindowDays) || 14,
            cancellationTerms: cancellationTerms || '7 days written notice.',
            rewardModel: rewardModel || rewardStructure,
            rewardType,
            rewardPercentage: rewardPercent ? Number(rewardPercent) : null,
            fixedRewardAmountMinor: fixedRewardMinor,
            rewardDisplayLabel: effectiveRewardDisplay,
            rewardTrigger: customRewardDetail || 'per verified result',
            payoutCondition: customFormulaDescription || 'Standard settlement upon verified outcome.',
            securedBudgetMinor: totalBudgetMinor,
            originalCurrency,
            originalDealValueMinor: origDealValueMinor,
            referenceCurrency,
            referenceValueMinor: refValueMinor,
            exchangeRateUsed: exchangeRateUsed ? Number(exchangeRateUsed) : null,
            exchangeRateDate: exchangeRateUsed ? new Date() : null,
            versions: {
              create: {
                versionNumber: 1,
                title: title.trim(),
                description: subscriberDescription || publicSummary || title.trim(),
                termsHash,
                rewardSummary: effectiveRewardDisplay,
                attributionWindowDays: Number(attributionWindowDays) || 30,
                termsAndConditions: cancellationTerms || evidenceRequired || 'Standard commercial performance terms apply.',
                isExclusive: false,
                requiresApproval: true,
                rewardRules: {
                  create: {
                    rewardType: rewardType === 'PERCENTAGE' ? 'PERCENTAGE_COMMISSION' : 'FIXED_COMMISSION',
                    amountMinor: fixedRewardMinor,
                    percentageBps: rewardPercent ? Math.round(Number(rewardPercent) * 100) : null,
                    description: effectiveRewardDisplay,
                    currency: referenceCurrency || 'TZS',
                  },
                },
              },
            },
          },
          include: {
            versions: true,
          },
        })

        // If submitted for review, create ApprovalRequest
        if (effectiveStatus === 'UNDER_REVIEW' && tx.approvalRequest?.create) {
          await tx.approvalRequest.create({
            data: {
              opportunityId: created.id,
              makerUserId: biz.userId,
              approvalStatus: 'PENDING_CHECKER',
              submittedAt: new Date(),
            },
          }).catch(() => {})
        }

        if (tx.auditLog?.create) {
          await tx.auditLog.create({
            data: {
              actorUserId: biz.userId,
              action: effectiveStatus === 'UNDER_REVIEW' ? 'OPPORTUNITY_SUBMITTED' : 'OPPORTUNITY_CREATED',
              entityType: 'OPPORTUNITY',
              entityId: created.id,
              afterData: { status: effectiveStatus, title: created.title },
            },
          }).catch(() => {})
        }

        return created
      })
    }

    return NextResponse.json(
      {
        success: true,
        message:
          effectiveStatus === 'UNDER_REVIEW'
            ? 'Opportunity submitted for Compliance Checker review.'
            : 'Opportunity draft saved successfully.',
        opportunity: {
          id: opportunityRecord.id,
          slug: opportunityRecord.slug,
          title: opportunityRecord.title,
          publicSummary: opportunityRecord.summary,
          subscriberDescription: opportunityRecord.description,
          type: opportunityRecord.opportunityType,
          category,
          region: opportunityRecord.region || region,
          commercialResult: opportunityRecord.commercialResultType,
          rewardStructure,
          rewardValueTZS: Number(rewardValueTZS),
          budgetTZS: Number(estimatedBudgetTZS),
          spentTZS: 0,
          status: opportunityRecord.status,
          version: 1,
          activePartners: 0,
          totalConversions: 0,
          trackingMethod: (body.trackingMethod || 'QR_CODE') as any,
          startDate: new Date().toISOString().split('T')[0],
          endDate: 'Open Access',
          attributionWindowDays: Number(attributionWindowDays) || 30,
          partnerDeliverables: partnerDeliverables || opportunityRecord.description,
          evidenceRequired: evidenceRequired || '',
          cancellationTerms: cancellationTerms || '7 days notice.',
          coverImageUrl: opportunityRecord.coverImageUrl || undefined,
          promoVideoUrl: opportunityRecord.promoVideoUrl || undefined,
          galleryImageUrls: opportunityRecord.galleryImageUrls || [],
          createdAt: 'Today',
        },
      },
      { status: targetOpportunityId ? 200 : 201 }
    )
  } catch (error: any) {
    if (error instanceof ZodError) return NextResponse.json({ success: false, error: error.issues[0]?.message || 'Invalid opportunity details.' }, { status: 400 })
    console.error('Create/Update business opportunity error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: error.statusCode || 500 }
    )
  }
}

