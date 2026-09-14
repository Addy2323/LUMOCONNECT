import { NextResponse } from 'next/server'
import { BeemClient } from '@/lib/providers/beem-client'

/**
 * GET /api/debug/beem-status
 * Diagnostic endpoint to check Beem configuration and connectivity.
 * Remove or restrict in production after debugging is complete.
 */
export async function GET() {
  const client = new BeemClient()
  const config = client.getConfig()

  const envCheck = {
    SMS_PROVIDER: process.env.SMS_PROVIDER || '(not set)',
    SMS_ENABLED: process.env.SMS_ENABLED || '(not set)',
    SMS_DRY_RUN: process.env.SMS_DRY_RUN || '(not set)',
    BEEM_API_KEY: process.env.BEEM_API_KEY ? `${process.env.BEEM_API_KEY.slice(0, 4)}***` : '(not set)',
    BEEM_SECRET_KEY: process.env.BEEM_SECRET_KEY ? `${process.env.BEEM_SECRET_KEY.slice(0, 8)}***` : '(not set)',
    BEEM_APPLICATION_ID: process.env.BEEM_APPLICATION_ID || '(not set)',
    BEEM_SENDER_ID: process.env.BEEM_SENDER_ID || '(not set)',
    NODE_ENV: process.env.NODE_ENV || '(not set)',
  }

  // Test connectivity to Beem OTP endpoint
  let connectivityTest: { reachable: boolean; status?: number; error?: string } = { reachable: false }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch('https://apiotp.beem.africa/v1/request', {
      method: 'POST',
      headers: {
        Authorization: client.getAuthHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ appId: Number(process.env.BEEM_APPLICATION_ID || 5075), msisdn: '255000000000' }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    const text = await res.text().catch(() => '')
    connectivityTest = {
      reachable: true,
      status: res.status,
      error: !res.ok ? text.slice(0, 300) : undefined,
    }
  } catch (err: any) {
    connectivityTest = {
      reachable: false,
      error: err?.message || 'Unknown error',
    }
  }

  return NextResponse.json({
    beemConfig: config,
    envCheck,
    connectivityTest,
    diagnosis: {
      willSendRealSMS: config.enabled && !config.dryRun && config.isConfigured,
      issues: [
        ...(!config.enabled ? ['❌ SMS_ENABLED is not "true" — Beem will run in dry-run mode'] : []),
        ...(config.dryRun ? ['❌ SMS_DRY_RUN is not "false" — Beem will simulate OTPs'] : []),
        ...(!config.isConfigured ? ['❌ BEEM_API_KEY or BEEM_SECRET_KEY is missing'] : []),
        ...(connectivityTest.status === 401 ? ['❌ Authentication failed (401) — check BEEM_API_KEY and BEEM_SECRET_KEY'] : []),
        ...(connectivityTest.status === 403 ? ['❌ Forbidden (403) — your Beem account may not have OTP access'] : []),
        ...(!connectivityTest.reachable ? [`❌ Cannot reach Beem API: ${connectivityTest.error}`] : []),
        ...(config.enabled && !config.dryRun && config.isConfigured && connectivityTest.reachable && connectivityTest.status !== 401 ? ['✅ Configuration looks correct — Beem should send real OTPs'] : []),
      ],
    },
  })
}
