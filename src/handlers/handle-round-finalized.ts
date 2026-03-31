import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { RoundStatus } from '../model'
import { EventContext } from '../types'

export async function handleRoundFinalized(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, log, rounds } = eventCtx

	const { roundId, randomA, randomB } = rips.events.RoundFinalized.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, rounds, roundIdStr)

	round.status = RoundStatus.Claiming
	round.randomA = randomA
	round.randomB = randomB

	rounds.set(roundIdStr, round)
}
