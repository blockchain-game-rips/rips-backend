import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { PrizeClaim, RoundStatus } from '../model'
import { EventContext } from '../types'

export async function handlePrizesClaimed(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, block, log, rounds, prizeClaims } = eventCtx

	const { roundId, user, ticketCount, prizeAmount } =
		rips.events.PrizesClaimed.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, rounds, roundIdStr)

	round.ticketsClaimed += Number(ticketCount)

	if (round.ticketsClaimed === round.ticketsSold) {
		round.status = RoundStatus.Claimed
	}

	rounds.set(roundIdStr, round)

	prizeClaims.push(
		new PrizeClaim({
			id: log.id,
			round,
			user: user.toLowerCase(),
			ticketCount,
			amount: prizeAmount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
