import { NextRequest } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { failure, json } from '@/modules/hot-deals/auth'
import { deliverHotDealNotifications, processHotDeals } from '@/modules/hot-deals/worker'
import { cleanupDeletedMerchantFiles } from '@/modules/identity/merchant-file-cleanup'

export async function POST(request: NextRequest) {
  const expected = process.env.HOT_DEALS_CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  if (!expected || expected.length < 32 || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return json({ error: 'Unauthorized' }, 401)
  try { return json({ ...await processHotDeals(), ...await deliverHotDealNotifications(), pendingMerchantFileCleanup: await cleanupDeletedMerchantFiles() }) }
  catch (error) { return failure(error) }
}
