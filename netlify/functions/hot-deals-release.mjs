export const config = { schedule: '* * * * *' }

export default async function () {
  const origin = process.env.URL
  const secret = process.env.HOT_DEALS_CRON_SECRET
  if (!origin || !secret) throw new Error('Hot deal scheduler configuration is missing')
  const response = await fetch(new URL('/api/hot-deals/process', origin), {
    method: 'POST', headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(25000),
  })
  if (!response.ok) throw new Error(`Hot deal release job failed (${response.status})`)
  return new Response(null, { status: 204 })
}
