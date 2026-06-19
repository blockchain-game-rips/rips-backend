import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { RipStatus, VrfRequestStatus } from '../model'
import { HandlerArgs } from '../types'

export async function handleRandomnessRequested(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, log } = args

	const { ripId, vrfRequestId } = rips.events.RandomnessRequested.decode(log)
	const ripIdStr = ripId.toString()

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripIdStr)

	rip.vrfRequestStatus = VrfRequestStatus.REQUESTED
	rip.vrfRequestId = vrfRequestId
	rip.status = RipStatus.VRF_REQUESTED

	entities.rips.set(ripIdStr, rip)
}
