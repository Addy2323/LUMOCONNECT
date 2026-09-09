import { NextRequest } from 'next/server'
import { z } from 'zod'
import { actor, failure, json, requireAdmin } from '@/modules/hot-deals/auth'
import { activate, dealDetails, publish } from '@/modules/hot-deals/service'
import { changeState, stateSchema, configureDeal, configurationSchema } from '@/modules/hot-deals/management'
import { disputeClaim, leadSchema, registerLead, validateOutcome, validationSchema } from '@/modules/hot-deals/claims'
import { approveReward, createPayoutInstruction, rewardApprovalSchema } from '@/modules/hot-deals/rewards'

type Context = { params: Promise<{ id: string }> }
export async function GET(request: NextRequest, context: Context) {
  try { const user = await actor(request); return json(await dealDetails(z.string().uuid().parse((await context.params).id), user.id, request.nextUrl.searchParams.get('room') === 'true')) }
  catch (error) { return failure(error) }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await actor(request)
    const id = z.string().uuid().parse((await context.params).id)
    const body = await request.json()
    switch (body.action) {
      case 'activate': {
        const input = z.object({ versionId: z.string().uuid(), termsHash: z.string().regex(/^[a-f0-9]{64}$/), accepted: z.literal(true) }).parse(body)
        return json(await activate(id, user, input.versionId, input.termsHash))
      }
      case 'publish': {
        requireAdmin(user)
        return json(await publish(id, user, z.object({ startAt: z.string().datetime({ offset: true }), paymentAttemptId: z.string().uuid(), reason: z.string().min(10).max(1000) }).parse(body)))
      }
      case 'state': return json(await changeState(id, user, stateSchema.parse(body)))
      case 'configure': return json(await configureDeal(id, user, configurationSchema.parse(body)))
      case 'lead': return json(await registerLead(id, user, leadSchema.parse(body)), 201)
      case 'validate': return json(await validateOutcome(id, user, validationSchema.parse(body)))
      case 'approveReward': return json(await approveReward(id, user, rewardApprovalSchema.parse(body)))
      case 'payout': {
        const input = z.object({ claimId: z.string().uuid(), payoutMethodId: z.string().uuid() }).parse(body)
        return json(await createPayoutInstruction(id, user, input.claimId, input.payoutMethodId))
      }
      case 'dispute': {
        const input = z.object({ claimId: z.string().uuid(), reason: z.string().min(10).max(1000), resolve: z.boolean().default(false) }).parse(body)
        return json(await disputeClaim(id, user, input.claimId, input.reason, input.resolve))
      }
      default: return json({ error: 'Unknown action.' }, 400)
    }
  } catch (error) { return failure(error) }
}
