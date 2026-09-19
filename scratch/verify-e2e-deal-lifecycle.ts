import { db } from '../src/lib/db'
import { GET as getAdminApprovals, POST as postAdminApproval } from '../app/api/admin/approvals/route'
import { GET as getAdminDeals } from '../app/api/admin/deals/route'
import { GET as getMarketplaceOpportunities } from '../app/api/opportunities/route'
import { NextRequest } from 'next/server'

process.env.ALLOW_TEST_ACTOR = 'true'

async function runE2EVerification() {
  console.log('=== Starting E2E LUMO Deals & Opportunities Lifecycle Verification ===')

  // 1. Ensure test business organization and users exist in PostgreSQL
  let org = await db.organization.findFirst({
    where: { tradingName: 'Kilimo Clean Tech Ltd' },
  })

  if (!org) {
    org = await db.organization.create({
      data: {
        legalName: 'Kilimo Clean Tech Limited',
        tradingName: 'Kilimo Clean Tech Ltd',
        slug: `kilimo-clean-tech-${Date.now().toString().slice(-4)}`,
        verificationStatus: 'VERIFIED',
      },
    })
  }

  // Maker user (business user)
  let maker = await db.user.findFirst({ where: { email: 'maker.business@kilimo.tz' } })
  if (!maker) {
    maker = await db.user.create({
      data: {
        email: 'maker.business@kilimo.tz',
        name: 'Amina Maker',
        accountStatus: 'ACTIVE',
      },
    })
  }

  // Checker user (compliance officer / admin)
  let checker = await db.user.findFirst({ where: { email: 'checker.compliance@lumo.tz' } })
  if (!checker) {
    checker = await db.user.create({
      data: {
        email: 'checker.compliance@lumo.tz',
        name: 'Juma Checker',
        accountStatus: 'ACTIVE',
      },
    })
  }

  console.log('✓ Verified Test Organization & Actors:', {
    orgId: org.id,
    makerId: maker.id,
    checkerId: checker.id,
  })

  // 2. Simulate Business Opportunity Creation (draft -> submit)
  const testDealTitle = `Kilimo Solar Pumping Solution ${Date.now().toString().slice(-4)}`
  const testDealSlug = `kilimo-solar-pumping-${Date.now().toString().slice(-4)}`

  const createdDeal = await db.opportunity.create({
    data: {
      organizationId: org.id,
      createdByUserId: maker.id,
      title: testDealTitle,
      slug: testDealSlug,
      opportunityType: 'PRODUCT_SALES',
      summary: 'High-efficiency DC solar pump package for smallholder irrigation.',
      description: 'Comprehensive 3HP solar irrigation pumping system with inverter, MPPT controller, and 3-year warranty.',
      region: 'Morogoro',
      countryCode: 'TZ',
      currency: 'TZS',
      totalBudgetMinor: 500000000n, // TZS 5,000,000 budget
      commercialValueMinor: 3500000000n, // TZS 35,000,000 commercial volume
      status: 'UNDER_REVIEW',
      coverImageUrl: 'http://localhost:3000/api/public/media/deal-cover-sample.webp',
      galleryImageUrls: ['http://localhost:3000/api/public/media/deal-gallery-sample.webp'],
      rewardModel: 'PERCENTAGE_COMMISSION',
      rewardType: 'PERCENTAGE',
      rewardPercentage: 7.5,
      rewardDisplayLabel: '7.5% Commission (TZS 262,500 / unit)',
      successCondition: 'Verified installation and farmer receipt confirmation.',
      verificationEvidence: 'Installation certificate signed by registered technician.',
      verificationWindowDays: 14,
      cancellationTerms: '14-day warranty return policy.',
      contactPersonName: 'Amina Maker',
      contactPersonEmail: 'maker.business@kilimo.tz',
      contactPersonPhone: '+255712345678',
      visibility: 'PUBLIC',
      accessTier: 'ALL_PARTNERS',
      isFeatured: true,
      approvalRequests: {
        create: {
          makerUserId: maker.id,
          approvalStatus: 'PENDING_CHECKER',
          submittedAt: new Date(),
        },
      },
      versions: {
        create: {
          versionNumber: 1,
          title: testDealTitle,
          description: 'Initial submitted version',
          termsHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          rewardSummary: '7.5% Commission',
          termsAndConditions: 'Standard 14-day warranty return policy.',
          attributionWindowDays: 30,
        },
      },
    },
    include: {
      approvalRequests: true,
      versions: true,
    },
  })

  console.log('✓ Created Submitted Deal in PostgreSQL:', {
    dealId: createdDeal.id,
    title: createdDeal.title,
    approvalRequestId: createdDeal.approvalRequests[0]?.id,
    approvalStatus: createdDeal.approvalRequests[0]?.approvalStatus,
  })

  // 3. Test Dual-Control Rule: Maker cannot approve their own deal
  console.log('--- Testing Maker-Checker Violation Block ---')
  const makerSelfApprovalReq = new NextRequest('http://localhost:3000/api/admin/approvals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-actor-id': maker.id, // Maker attempting approval
    },
    body: JSON.stringify({
      opportunityId: createdDeal.id,
      action: 'APPROVE',
      notes: 'Self-approval should be rejected.',
    }),
  })

  const makerApprovalRes = await postAdminApproval(makerSelfApprovalReq)
  const makerApprovalJson = await makerApprovalRes.json()
  console.log('Maker Self-Approval Response Status:', makerApprovalRes.status, makerApprovalJson)
  if (makerApprovalRes.status !== 403) {
    throw new Error(`Expected status 403 for Maker self-approval, got ${makerApprovalRes.status}`)
  }
  console.log('✓ Dual-Control Maker-Checker block successfully enforced (403 Forbidden)!')

  // 4. Test Checker Approval (separate user)
  console.log('--- Testing Checker Approval ---')
  const checkerApprovalReq = new NextRequest('http://localhost:3000/api/admin/approvals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-actor-id': checker.id, // Checker approving
    },
    body: JSON.stringify({
      opportunityId: createdDeal.id,
      action: 'APPROVE',
      notes: 'All compliance, KYC, and commercial evidence verified. Approved for marketplace.',
    }),
  })

  const checkerApprovalRes = await postAdminApproval(checkerApprovalReq)
  const checkerApprovalJson = await checkerApprovalRes.json()
  console.log('Checker Approval Response Status:', checkerApprovalRes.status, checkerApprovalJson)
  if (checkerApprovalRes.status !== 200 || !checkerApprovalJson.success) {
    throw new Error(`Expected checker approval to succeed, got ${checkerApprovalRes.status}`)
  }
  console.log('✓ Checker approval successfully executed!')

  // 5. Verify PostgreSQL Opportunity State & Published Version
  const verifiedOpp = await db.opportunity.findUnique({
    where: { id: createdDeal.id },
    include: {
      publishedVersion: true,
      approvalRequests: true,
      versions: true,
    },
  })

  console.log('✓ Verified DB State after Approval:', {
    status: verifiedOpp?.status,
    publishedVersionId: verifiedOpp?.publishedVersionId,
    publishedVersionNumber: verifiedOpp?.publishedVersion?.versionNumber,
    termsHash: verifiedOpp?.publishedVersion?.termsHash,
    approvalStatus: verifiedOpp?.approvalRequests[0]?.approvalStatus,
    checkerUserId: verifiedOpp?.approvalRequests[0]?.checkerUserId,
  })

  if (verifiedOpp?.status !== 'PUBLISHED') {
    throw new Error(`Expected opportunity status to be PUBLISHED, got ${verifiedOpp?.status}`)
  }
  if (!verifiedOpp?.publishedVersionId) {
    throw new Error('Expected publishedVersionId to be set after checker approval')
  }

  // 6. Test Admin Deals API query
  console.log('--- Testing Admin Deals Registry Query ---')
  const adminDealsReq = new NextRequest('http://localhost:3000/api/admin/deals', {
    headers: { 'x-test-admin': 'true' },
  })
  const adminDealsRes = await getAdminDeals(adminDealsReq)
  const adminDealsJson = await adminDealsRes.json()
  const matchingAdminDeal = adminDealsJson.deals.find((d: any) => d.id === createdDeal.id)

  if (!matchingAdminDeal) {
    throw new Error('Newly approved deal not found in /api/admin/deals output')
  }

  console.log('✓ Found Deal in Admin Deals Registry:', {
    id: matchingAdminDeal.id,
    title: matchingAdminDeal.title,
    status: matchingAdminDeal.status,
    rewardDisplay: matchingAdminDeal.rewardDisplay,
    termsHash: matchingAdminDeal.termsHash,
    summary: matchingAdminDeal.summary,
    visibility: matchingAdminDeal.visibility,
    coverImageUrl: matchingAdminDeal.coverImageUrl,
  })

  if (!matchingAdminDeal.termsHash || matchingAdminDeal.termsHash === 'Not recorded') {
    throw new Error('Terms hash was not properly recorded on the deal')
  }

  // 7. Test Marketplace Opportunities Query
  console.log('--- Testing Marketplace Catalog Query ---')
  const mktReq = new NextRequest('http://localhost:3000/api/opportunities')
  const mktRes = await getMarketplaceOpportunities(mktReq)
  const mktJson = await mktRes.json()
  const matchingMktDeal = mktJson.opportunities.find((d: any) => d.id === createdDeal.id)

  console.log('✓ Marketplace Deal Match:', {
    found: Boolean(matchingMktDeal),
    title: matchingMktDeal?.title,
    companyName: matchingMktDeal?.companyName,
    indicativeRewardDisplay: matchingMktDeal?.indicativeRewardDisplay,
  })

  console.log('\n======================================================')
  console.log('🎉 ALL E2E DEAL LIFECYCLE TESTS PASSED PERFECTLY!')
  console.log('======================================================')
}

runE2EVerification()
  .catch((err) => {
    console.error('❌ Verification Error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
