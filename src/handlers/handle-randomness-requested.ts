import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { RoundStatus } from '../model'
import { EventContext } from '../types'

export async function handleRandomnessRequested(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, log, rounds } = eventCtx

	const { roundId, vrfRequestId } =
		rips.events.RandomnessRequested.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, rounds, roundIdStr)

	round.status = RoundStatus.VRFRequested
	round.vrfRequestId = vrfRequestId

	rounds.set(roundIdStr, round)
}
