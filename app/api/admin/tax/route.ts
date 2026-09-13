import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const taxRules = [
      {
        id: 'tax_tz_resident',
        code: 'TRA_IND_5',
        title: 'Individual Resident Partner Withholding Tax',
        ratePercent: 5.0,
        applicableTo: 'PARTNER_COMMISSION',
        effectiveFrom: '2026-01-01',
        authority: 'TRA',
        isActive: true,
      },
      {
        id: 'tax_tz_nonresident',
        code: 'TRA_NON_15',
        title: 'Non-Resident Partner Withholding Tax',
        ratePercent: 15.0,
        applicableTo: 'PARTNER_COMMISSION',
        effectiveFrom: '2026-01-01',
        authority: 'TRA',
        isActive: true,
      },
      {
        id: 'tax_tz_fee',
        code: 'TRA_VAT_FEE',
        title: 'LUMO Platform Fee VAT & Excise',
        ratePercent: 18.0,
        applicableTo: 'PLATFORM_FEE',
        effectiveFrom: '2026-01-01',
        authority: 'TRA',
        isActive: true,
      },
    ]

    return NextResponse.json({ taxRules })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
