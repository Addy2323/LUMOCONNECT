import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Version computed at server boot / runtime
const SERVER_BUILD_ID =
  process.env.BUILD_ID ||
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.NETLIFY_BUILD_ID ||
  process.env.COMMIT_REF ||
  process.env.RENDER_GIT_COMMIT ||
  `v1.0.0-${process.env.NODE_ENV || 'production'}`

export async function GET() {
  return NextResponse.json(
    {
      version: SERVER_BUILD_ID,
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  )
}
