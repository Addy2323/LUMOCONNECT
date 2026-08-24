import { NextResponse, type NextRequest } from 'next/server'
import {
  generatePartnerStatement,
  listPartnerStatements,
  exportStatementCsv,
  type TaxClassification,
} from '@/modules/tax/service'
import { requireAuth } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') // 'json' | 'csv'
    const partnerId = searchParams.get('partnerId') || auth.userId

    const statements = listPartnerStatements(partnerId)

    if (format === 'csv' && statements.length > 0) {
      const csvData = exportStatementCsv(statements[0])
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${statements[0].statementNumber}.csv"`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      partnerId,
      total: statements.length,
      data: statements,
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 500
    const message = error instanceof Error ? error.message : 'Failed to fetch tax statements'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    const body = (await request.json().catch(() => ({}))) as {
      partnerId?: string
      partnerName?: string
      classification?: TaxClassification
      monthYear?: string
    }

    const partnerId = body.partnerId || auth.userId
    const partnerName = body.partnerName || auth.email.split('@')[0]
    const classification = body.classification || 'INDIVIDUAL_RESIDENT'
    const monthYear = body.monthYear || 'August 2026'

    const statement = generatePartnerStatement({
      partnerId,
      partnerName,
      classification,
      monthYear,
    })

    return NextResponse.json(
      {
        success: true,
        message: `TRA Partner Earnings Statement generated for ${monthYear}`,
        data: statement,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode || 400
    const message = error instanceof Error ? error.message : 'Failed to generate tax statement'
    return NextResponse.json({ success: false, error: message }, { status: statusCode })
  }
}
