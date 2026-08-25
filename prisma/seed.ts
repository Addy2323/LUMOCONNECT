/**
 * LUMO Database Seed Script
 *
 * Populates reference data required for the platform to function:
 * - Roles & permissions
 * - Subscription plans
 * - Opportunity categories
 * - Chart of accounts (Ledger)
 * - Notification templates
 * - Risk rules
 * - Test admin user, business org, and partner profile
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding LUMO database...\n')

  // ──────────────────────────────────────────────────
  // 1. ROLES
  // ──────────────────────────────────────────────────
  console.log('📋 Creating roles...')
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { code: 'CUSTOMER' },
      update: {},
      create: {
        code: 'CUSTOMER',
        name: 'Customer',
        scope: 'PLATFORM',
        description: 'End customer who discovers products via the marketplace',
        permissions: [],
      },
    }),
    prisma.role.upsert({
      where: { code: 'PARTNER' },
      update: {},
      create: {
        code: 'PARTNER',
        name: 'Partner',
        scope: 'PLATFORM',
        description: 'Commercial partner who promotes deals and earns commissions',
        permissions: ['opportunity.view', 'opportunity.apply', 'lead.submit', 'conversion.view', 'earnings.view'],
      },
    }),
    prisma.role.upsert({
      where: { code: 'BUSINESS_OWNER' },
      update: {},
      create: {
        code: 'BUSINESS_OWNER',
        name: 'Business Owner',
        scope: 'ORGANIZATION',
        description: 'Organization owner with full business portal access',
        permissions: ['opportunity.create', 'opportunity.publish', 'partner.manage', 'conversion.review', 'payout.view', 'funding.manage'],
      },
    }),
    prisma.role.upsert({
      where: { code: 'BUSINESS_STAFF' },
      update: {},
      create: {
        code: 'BUSINESS_STAFF',
        name: 'Business Staff',
        scope: 'ORGANIZATION',
        description: 'Organization member with limited business portal access',
        permissions: ['opportunity.create', 'partner.view', 'conversion.view'],
      },
    }),
    prisma.role.upsert({
      where: { code: 'BUSINESS_FINANCE' },
      update: {},
      create: {
        code: 'BUSINESS_FINANCE',
        name: 'Business Finance',
        scope: 'ORGANIZATION',
        description: 'Finance controller for the business organization',
        permissions: ['funding.manage', 'payout.view', 'conversion.review', 'reward.approve'],
      },
    }),
    prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: {
        code: 'ADMIN',
        name: 'Platform Administrator',
        scope: 'PLATFORM',
        description: 'LUMO platform administrator',
        permissions: [
          'opportunity.review', 'conversion.review', 'reward.approve',
          'payout.authorize', 'risk.review', 'dispute.resolve',
          'user.manage', 'verification.review', 'audit.read',
        ],
      },
    }),
    prisma.role.upsert({
      where: { code: 'SUPER_ADMIN' },
      update: {},
      create: {
        code: 'SUPER_ADMIN',
        name: 'Super Administrator',
        scope: 'PLATFORM',
        description: 'Full platform control including system settings and role management',
        permissions: ['*'],
      },
    }),
    prisma.role.upsert({
      where: { code: 'RISK_REVIEWER' },
      update: {},
      create: {
        code: 'RISK_REVIEWER',
        name: 'Risk Reviewer',
        scope: 'PLATFORM',
        description: 'Fraud and risk assessment specialist',
        permissions: ['risk.review', 'conversion.review', 'fraud.manage', 'verification.review'],
      },
    }),
    prisma.role.upsert({
      where: { code: 'SUPPORT' },
      update: {},
      create: {
        code: 'SUPPORT',
        name: 'Support Agent',
        scope: 'PLATFORM',
        description: 'Customer and partner support agent',
        permissions: ['dispute.resolve', 'user.view', 'conversion.view'],
      },
    }),
    prisma.role.upsert({
      where: { code: 'FINANCE' },
      update: {},
      create: {
        code: 'FINANCE',
        name: 'Platform Finance',
        scope: 'PLATFORM',
        description: 'Platform-level financial controller',
        permissions: ['payout.authorize', 'reward.approve', 'funding.view', 'reconciliation.manage', 'ledger.view'],
      },
    }),
  ])
  console.log(`  ✅ ${roles.length} roles created\n`)

  // ──────────────────────────────────────────────────
  // 2. SUBSCRIPTION PLANS
  // ──────────────────────────────────────────────────
  console.log('💳 Creating subscription plans...')
  const plans = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { code: 'FREE_TIER' },
      update: {},
      create: {
        code: 'FREE_TIER',
        name: 'Free Tier',
        billingPeriod: 'NONE',
        priceMinor: BigInt(0),
        currency: 'TZS',
        enterprise: false,
        features: ['Browse marketplace', 'View deal summaries', 'Limited deal details'],
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { code: 'MONTHLY' },
      update: {},
      create: {
        code: 'MONTHLY',
        name: 'Partner Monthly',
        billingPeriod: 'MONTHLY',
        priceMinor: BigInt(2500000), // TZS 25,000
        currency: 'TZS',
        enterprise: false,
        features: [
          'Full deal access',
          'Tracking links & QR codes',
          'Earnings dashboard',
          'Deal Rooms',
          'Sales toolkit',
          'Training centre',
          'Priority support',
        ],
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { code: 'SEMI_ANNUAL' },
      update: {},
      create: {
        code: 'SEMI_ANNUAL',
        name: 'Partner Semi-Annual',
        billingPeriod: 'SEMI_ANNUALLY',
        priceMinor: BigInt(10000000), // TZS 100,000
        currency: 'TZS',
        enterprise: false,
        features: [
          'All Monthly features',
          'Priority partner score boost',
          'Advanced analytics',
          'Bulk deal applications',
          '33% savings vs monthly',
        ],
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { code: 'ENTERPRISE' },
      update: {},
      create: {
        code: 'ENTERPRISE',
        name: 'Enterprise',
        billingPeriod: 'ANNUALLY',
        priceMinor: BigInt(0), // Custom pricing
        currency: 'TZS',
        enterprise: true,
        features: [
          'All Semi-Annual features',
          'Dedicated account manager',
          'Custom API integrations',
          'White-label deal pages',
          'SLA guarantees',
          'Custom reporting',
        ],
      },
    }),
  ])
  console.log(`  ✅ ${plans.length} subscription plans created\n`)

  // ──────────────────────────────────────────────────
  // 3. OPPORTUNITY CATEGORIES
  // ──────────────────────────────────────────────────
  console.log('📂 Creating opportunity categories...')
  const categories = await Promise.all(
    [
      { name: 'Renewable Energy', slug: 'renewable-energy', sortOrder: 1 },
      { name: 'Fintech & Payments', slug: 'fintech-payments', sortOrder: 2 },
      { name: 'Travel & Hospitality', slug: 'travel-hospitality', sortOrder: 3 },
      { name: 'Agriculture & FMCG', slug: 'agriculture-fmcg', sortOrder: 4 },
      { name: 'Technology & Enterprise', slug: 'technology-enterprise', sortOrder: 5 },
      { name: 'Food & Beverage', slug: 'food-beverage', sortOrder: 6 },
      { name: 'Education & EdTech', slug: 'education-edtech', sortOrder: 7 },
      { name: 'Construction & Sourcing', slug: 'construction-sourcing', sortOrder: 8 },
      { name: 'Healthcare & Wellness', slug: 'healthcare-wellness', sortOrder: 9 },
      { name: 'Automotive & Transport', slug: 'automotive-transport', sortOrder: 10 },
      { name: 'Fashion & Beauty', slug: 'fashion-beauty', sortOrder: 11 },
      { name: 'Real Estate', slug: 'real-estate', sortOrder: 12 },
    ].map((cat) =>
      prisma.opportunityCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  )
  console.log(`  ✅ ${categories.length} opportunity categories created\n`)

  // ──────────────────────────────────────────────────
  // 4. CHART OF ACCOUNTS (LEDGER)
  // ──────────────────────────────────────────────────
  console.log('📊 Creating ledger accounts (chart of accounts)...')
  const ledgerAccounts = await Promise.all(
    [
      { accountCode: 'ESCROW_MAIN', name: 'Platform Escrow — Main Safeguarding Account', ownerType: 'PLATFORM' },
      { accountCode: 'REVENUE_PLATFORM_FEE', name: 'Platform Revenue — Commission Fees (3%)', ownerType: 'PLATFORM' },
      { accountCode: 'REVENUE_SUBSCRIPTION', name: 'Platform Revenue — Subscription Fees', ownerType: 'PLATFORM' },
      { accountCode: 'LIABILITY_PARTNER_EARNINGS', name: 'Liability — Partner Earnings Payable', ownerType: 'PLATFORM' },
      { accountCode: 'LIABILITY_TAX_WITHHOLDING', name: 'Liability — TRA Tax Withholding (5%)', ownerType: 'PLATFORM' },
      { accountCode: 'EXPENSE_PAYOUT_FEES', name: 'Expense — Mobile Money / Bank Payout Fees', ownerType: 'PLATFORM' },
      { accountCode: 'EXPENSE_PAYMENT_PROCESSING', name: 'Expense — Payment Gateway Processing Fees', ownerType: 'PLATFORM' },
      { accountCode: 'SUSPENSE', name: 'Suspense — Unmatched Transactions', ownerType: 'PLATFORM' },
    ].map((acct) =>
      prisma.ledgerAccount.upsert({
        where: { accountCode: acct.accountCode },
        update: {},
        create: acct,
      })
    )
  )
  console.log(`  ✅ ${ledgerAccounts.length} ledger accounts created\n`)

  // ──────────────────────────────────────────────────
  // 5. NOTIFICATION TEMPLATES
  // ──────────────────────────────────────────────────
  console.log('🔔 Creating notification templates...')
  const templates = await Promise.all(
    [
      { code: 'WELCOME', channel: 'IN_APP' as const, titleTemplate: 'Welcome to LUMO', bodyTemplate: 'Your account has been created. Complete your profile to get started.' },
      { code: 'OPPORTUNITY_PUBLISHED', channel: 'IN_APP' as const, titleTemplate: 'New Opportunity Available', bodyTemplate: 'A new {{opportunityType}} opportunity "{{title}}" is now live in your region.' },
      { code: 'APPLICATION_APPROVED', channel: 'IN_APP' as const, titleTemplate: 'Application Approved', bodyTemplate: 'Your application for "{{title}}" has been approved. Your tracking link is ready.' },
      { code: 'APPLICATION_REJECTED', channel: 'IN_APP' as const, titleTemplate: 'Application Update', bodyTemplate: 'Your application for "{{title}}" was not approved. Reason: {{reason}}' },
      { code: 'CONVERSION_TRACKED', channel: 'IN_APP' as const, titleTemplate: 'New Conversion Tracked', bodyTemplate: 'A conversion worth {{value}} has been attributed to your tracking link for "{{title}}".' },
      { code: 'REWARD_APPROVED', channel: 'IN_APP' as const, titleTemplate: 'Reward Approved', bodyTemplate: 'Your reward of {{amount}} for "{{title}}" has been approved and is queued for payout.' },
      { code: 'PAYOUT_INITIATED', channel: 'IN_APP' as const, titleTemplate: 'Payout Initiated', bodyTemplate: '{{amount}} is being sent to your {{payoutMethod}}. Reference: {{reference}}' },
      { code: 'PAYOUT_COMPLETED', channel: 'SMS' as const, titleTemplate: 'LUMO Payout Received', bodyTemplate: 'TZS {{amount}} has been sent to your {{payoutMethod}}. Ref: {{reference}}. Thank you for partnering with LUMO.' },
      { code: 'RISK_ALERT_HIGH', channel: 'IN_APP' as const, titleTemplate: 'Risk Alert', bodyTemplate: 'A high-risk alert (score {{score}}/100) has been flagged on {{entity}}. Review required.' },
      { code: 'DISPUTE_OPENED', channel: 'IN_APP' as const, titleTemplate: 'Dispute Filed', bodyTemplate: 'A {{disputeType}} dispute has been opened for deal "{{title}}". Response due by {{dueDate}}.' },
      { code: 'VERSION_CONSENT', channel: 'IN_APP' as const, titleTemplate: 'Deal Terms Updated', bodyTemplate: '"{{title}}" has been updated to Version {{version}}. Review the new terms and confirm your consent.' },
      { code: 'VERIFICATION_APPROVED', channel: 'IN_APP' as const, titleTemplate: 'Verification Approved', bodyTemplate: 'Your {{verificationType}} verification has been approved. You now have full platform access.' },
    ].map((t) =>
      prisma.notificationTemplate.upsert({
        where: { code: t.code },
        update: {},
        create: t,
      })
    )
  )
  console.log(`  ✅ ${templates.length} notification templates created\n`)

  // ──────────────────────────────────────────────────
  // 6. RISK RULES
  // ──────────────────────────────────────────────────
  console.log('🛡️ Creating risk rules...')
  const riskRules = await Promise.all(
    [
      {
        code: 'SELF_REFERRAL',
        name: 'Self-Referral Detection',
        description: 'Flags conversions where the partner and customer share identifying characteristics',
        ruleLogic: { checkFields: ['ip_address', 'device_fingerprint', 'email_domain'], threshold: 0.8 },
      },
      {
        code: 'HIGH_VELOCITY',
        name: 'High Velocity Conversions',
        description: 'Flags unusually rapid conversion patterns from a single tracking asset',
        ruleLogic: { maxConversionsPerHour: 10, maxConversionsPerDay: 50, windowHours: 1 },
      },
      {
        code: 'SUSPICIOUS_IP',
        name: 'Suspicious IP Pattern',
        description: 'Flags conversions originating from known VPN, proxy, or data center IP ranges',
        ruleLogic: { checkVPN: true, checkProxy: true, checkDataCenter: true, maxSameIpConversions: 5 },
      },
      {
        code: 'BOT_PATTERN',
        name: 'Bot-Like Behaviour',
        description: 'Detects automated or scripted conversion submissions',
        ruleLogic: { minSessionDurationMs: 3000, checkMouseMovement: true, checkFormTiming: true },
      },
      {
        code: 'DUPLICATE_CUSTOMER',
        name: 'Duplicate Customer Reference',
        description: 'Flags conversions with the same customer reference across different partners',
        ruleLogic: { matchFields: ['customer_email', 'customer_phone', 'external_reference'], crossPartner: true },
      },
      {
        code: 'VALUE_ANOMALY',
        name: 'Value Anomaly Detection',
        description: 'Flags conversions with values significantly outside the expected range for the opportunity',
        ruleLogic: { stdDevMultiplier: 3.0, minSampleSize: 10 },
      },
    ].map((rule) =>
      prisma.riskRule.upsert({
        where: { code: rule.code },
        update: {},
        create: rule,
      })
    )
  )
  console.log(`  ✅ ${riskRules.length} risk rules created\n`)

  // ──────────────────────────────────────────────────
  // 7. TEST USER, ORGANIZATION & PARTNER
  // ──────────────────────────────────────────────────
  // 7. ROOT SUPER ADMIN ACCOUNT (Clean Production Bootstrap)
  // ──────────────────────────────────────────────────
  console.log('👤 Creating root Super Admin user...')

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lumo.co.tz' },
    update: {},
    create: {
      email: 'admin@lumo.co.tz',
      name: 'LUMO Platform Super Admin',
      accountStatus: 'ACTIVE',
      emailVerified: true,
    },
  })

  const adminRole = roles.find((r) => r.code === 'SUPER_ADMIN')!
  const existingAdminRole = await prisma.roleAssignment.findFirst({
    where: { userId: adminUser.id, roleId: adminRole.id, organizationId: null },
  })
  if (!existingAdminRole) {
    await prisma.roleAssignment.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    })
  }

  // Set permanent credentials for Super Admin (Admin@Lumo2026!)
  const salt = crypto.randomBytes(16).toString('hex')
  const hashedPassword = crypto.scryptSync('Admin@Lumo2026!', salt, 64).toString('hex') + ':' + salt
  
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: 'credential',
        accountId: 'admin@lumo.co.tz',
      },
    },
    update: {
      password: hashedPassword,
    },
    create: {
      userId: adminUser.id,
      providerId: 'credential',
      accountId: 'admin@lumo.co.tz',
      password: hashedPassword,
    },
  })

  console.log('  ✅ Root Admin initialized: admin@lumo.co.tz (Password configured)')
  console.log('\n🎉 LUMO clean production database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
