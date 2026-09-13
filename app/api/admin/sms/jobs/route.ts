import { NextRequest, NextResponse } from 'next/server'
import { getSmsJobs, getSmsBatches, updateSmsJobStatus, getSmsJobById, addSmsAuditLog } from '@/modules/sms/store'
import { getMesejiClient } from '@/lib/providers/meseji-client'
import type { SmsJobStatus } from '@/modules/sms/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as SmsJobStatus | undefined
    const channel = searchParams.get('channel') as any
    const operator = searchParams.get('operator') as any
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const jobs = getSmsJobs({
      status,
      channel,
      operator,
      limit,
      offset,
    })

    const batches = getSmsBatches().slice(0, 20)

    // Formatted for admin display with explicit aggregate reconciliation guidance
    const formattedJobs = jobs.map((j) => ({
      ...j,
      // CRITICAL: Meseji returns aggregate stats per batch, not individual delivery receipts
      deliveryReceiptNotice: 'Recipient delivery unavailable (Aggregate batch reporting only)',
    }))

    return NextResponse.json({
      jobs: formattedJobs,
      batches,
      total: jobs.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list SMS jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { action, jobId, batchId } = body

    if (action === 'RETRY') {
      if (!jobId) {
        return NextResponse.json({ error: 'jobId is required for retry' }, { status: 400 })
      }
      const job = getSmsJobById(jobId)
      if (!job) {
        return NextResponse.json({ error: 'SMS Job not found' }, { status: 404 })
      }

      if (job.status !== 'FAILED' && job.status !== 'UNCERTAIN') {
        return NextResponse.json(
          { error: `Cannot retry job with status ${job.status}. Only FAILED or UNCERTAIN jobs can be retried.` },
          { status: 400 }
        )
      }

      const client = getMesejiClient()
      const result = await client.sendSms({
        recipientPhone: job.recipientPhone,
        messageText: job.messageText,
        senderId: job.senderId,
      })

      const updated = updateSmsJobStatus(
        job.id,
        result.success ? 'SUBMITTED' : 'FAILED',
        result.batchId,
        result.error
      )

      addSmsAuditLog(
        'SMS_JOB_RETRIED',
        'admin_console',
        { jobId: job.id, prevStatus: job.status, newStatus: updated?.status },
        job.id
      )

      return NextResponse.json({ success: true, job: updated, result })
    }

    if (action === 'CANCEL') {
      if (!jobId) {
        return NextResponse.json({ error: 'jobId is required for cancellation' }, { status: 400 })
      }
      const job = getSmsJobById(jobId)
      if (!job) {
        return NextResponse.json({ error: 'SMS Job not found' }, { status: 404 })
      }

      const updated = updateSmsJobStatus(job.id, 'CANCELLED', undefined, 'Manually cancelled by admin')
      addSmsAuditLog('SMS_JOB_CANCELLED', 'admin_console', { jobId: job.id }, job.id)

      return NextResponse.json({ success: true, job: updated })
    }

    if (action === 'REFRESH_BATCH_STATS') {
      if (!batchId) {
        return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
      }
      const client = getMesejiClient()
      const stats = await client.getBatchStats(batchId)

      return NextResponse.json({ success: true, batchId, stats })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process SMS job action' },
      { status: 500 }
    )
  }
}
