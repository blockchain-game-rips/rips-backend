import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { RoundStatus, VrfRequestStatus } from '../model'
import { HandlerArgs } from '../types'

export async function handleRandomnessFulfilled(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, log } = args

	const { roundId, randomA, randomB } =
		rips.events.RandomnessFulfilled.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, entities.rounds, roundIdStr)

	round.vrfRequestStatus = VrfRequestStatus.Fulfilled
	round.randomA = randomA
	round.randomB = randomB
	round.status = RoundStatus.CLAIMING

	entities.rounds.set(roundIdStr, round)
}
