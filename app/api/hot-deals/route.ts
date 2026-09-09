import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { actor, failure, json } from '@/modules/hot-deals/auth'
import { publicTeaser } from '@/modules/hot-deals/policy'
import { submissionSchema, submit } from '@/modules/hot-deals/management'

export async function GET() {
  try {
    const deals = await db.hotDeal.findMany({ where: { visibilityStatus: 'PUBLIC_TEASER', status: { in: ['SCHEDULED_PRIVATE_RELEASE', 'PRIVATE_HOT_DEAL', 'PARTNER_RELEASE', 'FULL'] }, opportunity: { deletedAt: null } }, orderBy: { privateAccessStartAt: 'desc' }, take: 50 })
    return json({ deals: deals.map(deal => publicTeaser(deal)), serverNow: new Date().toISOString() })
  } catch (error) { return failure(error) }
}
export async function POST(request: NextRequest) {
  try { return json(await submit(await actor(request), submissionSchema.parse(await request.json())), 201) }
  catch (error) { return failure(error) }
}
