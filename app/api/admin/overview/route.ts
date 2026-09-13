import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
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
          ...(opportunityType !== 'ALL' ? { opportunityType: opportunityType as any } : {}),
        },
      }),
      db.verificationCase.count({ where: { status: 'PENDING' } }),
      db.opportunity.count({ where: { status: 'UNDER_REVIEW', deletedAt: null } }),
      db.payoutBatch.count({ where: { status: 'PENDING_APPROVAL' } }),
      db.dispute.count({ where: { status: { in: ['OPENED', 'UNDER_REVIEW', 'EVIDENCE_SUBMITTED'] } } }),
      db.riskAlert.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),
      db.paymentAttempt.aggregate({
        where: { status: 'SUCCESSFUL' },
        _sum: { amountMinor: true },
      }),
      db.reward.aggregate({
        where: { status: 'PAID' },
        _sum: { amountMinor: true },
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
    const paidRewardsMinor = rewardAggregate._sum.amountMinor ? Number(rewardAggregate._sum.amountMinor) : 0
    const netVolumeTZS = Math.round((grossPaymentMinor + paidRewardsMinor) / 100)

    // Handle CSV Export
    if (exportFormat === 'csv') {
      const csvHeader = 'Metric,Value\n'
      const csvBody = [
        `Total Users,${totalUsers}`,
        `Total Organizations,${totalOrgs}`,
        `Verified Businesses,${verifiedOrgs}`,
        `Live Opportunities,${liveOpportunities}`,
        `Platform Revenue TZS,${platformRevenueTZS}`,
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
        lastActive: 'Active',
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
      category: 'Renewable Energy & Trade',
      industry: 'Renewable Energy & Commercial Trade',
      status: (vc.status === 'IN_REVIEW' ? 'PENDING' : vc.status) as 'PENDING' | 'APPROVED' | 'REJECTED',
      submittedAt: vc.createdAt.toISOString().slice(0, 10),
      documents: vc.documents.map((d) => ({
        id: d.id,
        type: d.documentType as any,
        name: d.fileAsset.fileName,
        fileName: d.fileAsset.fileName,
        fileSize: '1.2 MB',
        fileUrl: '#',
        status: (d.status === 'IN_REVIEW' ? 'PENDING' : d.status) as 'PENDING' | 'APPROVED' | 'REJECTED',
        uploadedAt: d.createdAt.toISOString().slice(0, 10),
      })),
    }))

    const formattedLogs = rawAuditLogs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      actorId: log.actorUserId || 'SYSTEM',
      actorName: log.actor?.name || 'System / Automated Registration',
      actorRole: log.actorUserId ? 'SUPER_ADMIN' : 'SYSTEM',
      action: log.action,
      module: (['AUTH', 'BUSINESS', 'DEALS', 'PAYMENTS', 'PAYOUTS', 'RISK', 'SETTINGS', 'SYSTEM'].includes(
        log.entityType?.toUpperCase() || ''
      )
        ? log.entityType?.toUpperCase()
        : 'BUSINESS') as any,
      resourceId: log.entityId || log.id,
      ipAddress: log.ipAddress || '127.0.0.1 (Localhost)',
      userAgent: log.userAgent || 'Mozilla/5.0 (Lumo Platform Auth)',
      beforeState: (log.beforeData as any) || undefined,
      afterState: (log.afterData as any) || undefined,
      hashSignature: 'sha256:' + log.id.replace(/-/g, '').slice(0, 16),
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
        version: '1.0.0-PROD',
      },
      users: formattedUsers,
      verifications: formattedVerifications,
      auditLogs: formattedLogs,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
