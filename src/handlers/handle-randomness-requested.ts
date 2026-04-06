import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { VrfRequestStatus } from '../model'
import { HandlerArgs } from '../types'

export async function handleRandomnessRequested(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, log } = args

	const { roundId, vrfRequestId } =
		rips.events.RandomnessRequested.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, entities.rounds, roundIdStr)

	round.vrfRequestStatus = VrfRequestStatus.Requested
	round.vrfRequestId = vrfRequestId

	entities.rounds.set(roundIdStr, round)
}
