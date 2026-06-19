import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { RipStatus, VrfRequestStatus } from '../model'
import { HandlerArgs } from '../types'

export async function handleRandomnessFulfilled(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, log } = args

	const { ripId, randomA, randomB } =
		rips.events.RandomnessFulfilled.decode(log)
	const ripIdStr = ripId.toString()

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripIdStr)

	rip.vrfRequestStatus = VrfRequestStatus.FULFILLED
	rip.randomA = randomA
	rip.randomB = randomB
	rip.status = RipStatus.CLAIMING

	entities.rips.set(ripIdStr, rip)
}
