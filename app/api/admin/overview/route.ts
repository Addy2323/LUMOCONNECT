import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { db } from '@/lib/db'
import { generateDateBuckets, mergeEventSeries, AnalyticsPeriod, RawEventItem } from '@/lib/dynamicDateRange'

export async function GET(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region') || 'ALL'
    const opportunityType = searchParams.get('type') || 'ALL'
    const period = searchParams.get('period') || '30D'
    const exportFormat = searchParams.get('export')

    // 1. Total counts from Database
    const [
      totalUsers,
      totalOrgs,
      verifiedOrgs,
      liveOpportunities,
      pendingVerifications,
      pendingDeals,
      pendingPayouts,
      openDisputes,
      flaggedFraud,
      paymentAggregate,
      rewardAggregate,
      usersList,
      vCases,
      rawAuditLogs,
    ] = await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.organization.count({ where: { deletedAt: null } }),
      db.organization.count({ where: { verificationStatus: 'VERIFIED', deletedAt: null } }),
      db.opportunity.count({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          ...(region !== 'ALL' ? { region } : {}),
          ...(opportunityType !== 'ALL' ? { opportunityType: opportunityType as import("@prisma/client").OpportunityType } : {}),
        },
      }),
      db.verificationCase.count({ where: { status: 'PENDING' } }),
      db.opportunity.count({ where: { status: 'UNDER_REVIEW', deletedAt: null } }),
      db.payout.count({ where: { status: 'DRAFT' } }),
      db.dispute.count({ where: { status: { in: ['OPENED', 'UNDER_REVIEW', 'EVIDENCE_SUBMITTED'] } } }),
      db.riskAlert.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      db.paymentAttempt.aggregate({
        where: { status: 'SUCCESSFUL', currency: 'TZS' },
        _sum: { amountMinor: true },
      }),
      db.reward.aggregate({
        where: { status: 'PAID' },
        _sum: { netAmountMinor: true },
      }),
      db.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          accountStatus: true,
          twoFactorEnabled: true,
          createdAt: true,
          roleAssignments: {
            select: {
              role: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
          memberships: {
            select: {
              organization: {
                select: {
                  legalName: true,
                  tradingName: true,
                  verificationStatus: true,
                },
              },
            },
          },
          verificationCasesUser: {
            select: {
              status: true,
            },
          },
        },
      }),
      db.verificationCase.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: true,
          organization: true,
          documents: {
            include: {
              fileAsset: true,
            },
          },
        },
      }),
      db.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          actor: true,
        },
      }),
    ])

    // Calculate Platform Revenue in TZS
    const grossPaymentMinor = paymentAggregate._sum.amountMinor ? Number(paymentAggregate._sum.amountMinor) : 0
    const platformRevenueTZS = Math.round(grossPaymentMinor / 100)
    const paidRewardsMinor = rewardAggregate._sum.netAmountMinor ? Number(rewardAggregate._sum.netAmountMinor) : 0
    const netVolumeTZS = grossPaymentMinor / 100

    // Handle CSV Export
    if (exportFormat === 'csv') {
      const csvHeader = 'Metric,Value\n'
      const csvBody = [
        `Total Users,${totalUsers}`,
        `Total Organizations,${totalOrgs}`,
        `Verified Businesses,${verifiedOrgs}`,
        `Live Opportunities,${liveOpportunities}`,
        `Gross Collections TZS,${platformRevenueTZS}`,
        `Pending Verifications,${pendingVerifications}`,
        `Pending Deal Approvals,${pendingDeals}`,
        `Pending Payout Batches,${pendingPayouts}`,
        `Open Disputes,${openDisputes}`,
        `Flagged Fraud Alerts,${flaggedFraud}`,
      ].join('\n')

      return new NextResponse(csvHeader + csvBody, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="lumo-platform-report-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    const formattedUsers = usersList.map((u) => {
      const hasOrg = u.memberships && u.memberships.length > 0
      const roleCode = u.roleAssignments[0]?.role?.code || (hasOrg ? 'BUSINESS_OWNER' : 'CUSTOMER')
      const roleMapped =
        roleCode === 'SUPER_ADMIN' || roleCode === 'ADMIN'
          ? 'ADMIN'
          : roleCode === 'BUSINESS_OWNER' || roleCode === 'BUSINESS' || hasOrg
          ? 'BUSINESS'
          : roleCode === 'PARTNER'
          ? 'PARTNER'
          : 'CUSTOMER'

      const kycStatus =
        u.verificationCasesUser[0]?.status === 'APPROVED'
          ? 'VERIFIED'
          : u.verificationCasesUser[0]?.status === 'REJECTED'
          ? 'REJECTED'
          : 'PENDING'

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '—',
        role: roleMapped,
        status: u.accountStatus,
        mfaEnabled: u.twoFactorEnabled,
        lastActive: 'Not recorded',
        joinedDate: u.createdAt.toISOString().slice(0, 10),
        totalTransactions: 0,
        balanceTZS: 0,
        kycStatus,
        organizationName:
          u.memberships[0]?.organization?.tradingName ||
          u.memberships[0]?.organization?.legalName,
      }
    })

    const formattedVerifications = vCases.map((vc) => ({
      id: vc.id,
      organizationId: vc.organizationId,
      businessName:
        vc.organization?.legalName ||
        vc.organization?.tradingName ||
        vc.user?.name ||
        'Business',
      tradingName:
        vc.organization?.tradingName || vc.organization?.legalName || '',
      registrationNumber: vc.organization?.registrationNumber || 'Pending',
      tinNumber: vc.organization?.tin || 'Pending',
      contactPerson: vc.user?.name || 'Representative',
      email: vc.user?.email || '—',
      phone: vc.user?.phone || '—',
      category: 'Not recorded',
      industry: 'Not recorded',
      status: (vc.status === 'IN_REVIEW' ? 'PENDING' : vc.status) as 'PENDING' | 'APPROVED' | 'REJECTED',
      submittedAt: vc.createdAt.toISOString().slice(0, 10),
      documents: vc.documents.map((d) => ({
        id: d.id,
        type: d.documentType,
        name: d.fileAsset.fileName,
        fileName: d.fileAsset.fileName,
        fileSize: `${d.fileAsset.fileSizeBytes} bytes`,
        fileUrl: '#',
        status: (vc.status === 'IN_REVIEW' ? 'PENDING' : vc.status) as 'PENDING' | 'APPROVED' | 'REJECTED',
        uploadedAt: d.createdAt.toISOString().slice(0, 10),
      })),
    }))

    const formattedLogs = rawAuditLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      actorId: log.actorUserId || 'SYSTEM',
      actorName: log.actor?.name || 'System / Automated Registration',
      actorRole: log.actorUserId ? 'Not recorded at event time' : 'SYSTEM',
      action: log.action,
      module: (['AUTH', 'BUSINESS', 'DEALS', 'PAYMENTS', 'PAYOUTS', 'RISK', 'SETTINGS', 'SYSTEM'].includes(
        log.entityType?.toUpperCase() || ''
      )
        ? log.entityType?.toUpperCase()
        : 'BUSINESS'),
      resourceId: log.entityId || log.id,
      ipAddress: log.ipAddress || 'Not recorded',
      userAgent: log.userAgent || 'Not recorded',
      beforeState: log.beforeData || undefined,
      afterState: log.afterData || undefined,
      hashSignature: 'Not recorded',
    }))

    // Dynamic Rolling Time-Series Engine for Admin Chart
    const validPeriod: AnalyticsPeriod = (['30D', '6M', '12M'].includes(period) ? period : '30D') as AnalyticsPeriod
    const buckets = generateDateBuckets(validPeriod)

    const rawEvents: RawEventItem[] = []
    if (process.env.DATABASE_URL?.trim()) {
        const [recentPayments, recentUsers] = await Promise.all([
          db.paymentAttempt.findMany({
            where: { status: 'SUCCESSFUL', currency: 'TZS' },
            select: { createdAt: true, amountMinor: true },

          }),
          db.user.findMany({
            where: { deletedAt: null },
            select: { createdAt: true },

          }),
        ])

        recentPayments.forEach((p) => {
          rawEvents.push({
            timestamp: p.createdAt,
            type: 'TRANSACTION',
            amountTZS: Number(p.amountMinor) / 100,
          })
        })

        recentUsers.forEach((u) => {
          rawEvents.push({
            timestamp: u.createdAt,
            type: 'USER_SESSION',
            activeUsers: 1,
          })
        })

    }

    const populatedSeries = mergeEventSeries(buckets, rawEvents, validPeriod).map((pt) => ({
      ...pt,
      txValue: Number((pt.txValue / 1000000).toFixed(2)), // in Millions for left YAxis
      activeUsers: pt.activeUsers, // integer active users
    }))

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers,
        totalOrgs,
        verifiedBusinesses: verifiedOrgs,
        liveOpportunities,
        platformRevenueTZS,
        netVolumeTZS,
        pendingVerifications,
        pendingDeals,
        pendingPayouts,
        openDisputes,
        flaggedFraud,
      },
      systemHealth: {
        databaseConnected: true,
        uptimeSeconds: Math.floor(process.uptime()),
        lastSync: new Date().toISOString(),
        version: process.env.npm_package_version ?? null,
      },
      users: formattedUsers,
      verifications: formattedVerifications,
      auditLogs: formattedLogs,
      series: populatedSeries,
    })
  } catch {
    return NextResponse.json({ error: 'Unable to load overview. Please retry.' }, { status: 500 })
  }
}
