import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { RipStatus, VrfRequestStatus } from '../model'
import { applyStatus } from '../rip-status'
import { HandlerArgs } from '../types'

export async function handleRandomnessFulfilled(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, log } = args

	const { ripId, randomA, randomB } =
		rips.events.RandomnessFulfilled.decode(log)
	const ripIdStr = ripId.toString()

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripIdStr)

	if (!applyStatus(rip, RipStatus.CLAIMING, ctx)) return

	rip.vrfRequestStatus = VrfRequestStatus.FULFILLED
	rip.randomA = randomA
	rip.randomB = randomB
	rip.settleBlockNumber = BigInt(log.block.height)
	rip.settleLogIndex = log.logIndex

	entities.rips.set(ripIdStr, rip)
}
