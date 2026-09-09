import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { RipStatus, VrfRequestStatus } from '../model'
import { applyStatus } from '../rip-status'
import { HandlerArgs } from '../types'

export async function handleRandomnessRequested(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, log } = args

	const { ripId, vrfRequestId } = rips.events.RandomnessRequested.decode(log)
	const ripIdStr = ripId.toString()

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripIdStr)

	if (!applyStatus(rip, RipStatus.VRF_REQUESTED, ctx)) return

	rip.vrfRequestStatus = VrfRequestStatus.REQUESTED
	rip.vrfRequestId = vrfRequestId

	entities.rips.set(ripIdStr, rip)
}
