import { NextResponse } from 'next/server'
import { internationalService } from '@/modules/international/service'

export async function GET() {
  try {
    const stats = await internationalService.getDynamicStats()
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    })
  } catch (error: any) {
    console.error('Fetch international stats error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load international stats' },
      { status: 500 }
    )
  }
}
