import { runReleasePrivateDealsJob, runExpireSubscriptionsJob, runRewardValidationJob, runNotificationJob } from '../src/modules/jobs'
import { processHotDeals, deliverHotDealNotifications } from '../src/modules/hot-deals/worker'
import { db } from '../src/lib/db'

let stopped = false
process.on('SIGTERM', () => { stopped = true })
process.on('SIGINT', () => { stopped = true })

async function main() {
  console.log('[Worker] Lumo Commercial Operations & Hot Deals Worker started.')
  let iteration = 0

  while (!stopped) {
    try {
      // Run release evaluation & notifications every second
      await processHotDeals()
      await deliverHotDealNotifications()
      await runReleasePrivateDealsJob()
      await runNotificationJob()

      // Run subscription sweeps and reward validation every 30 iterations (~30s)
      if (iteration % 30 === 0) {
        await runExpireSubscriptionsJob()
        await runRewardValidationJob()
      }

      iteration++
    } catch (error) {
      console.error('[Worker] Commercial worker cycle failed; retrying:', error instanceof Error ? error.message : error)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log('[Worker] Worker stopping...')
  await db.$disconnect()
}

void main()
