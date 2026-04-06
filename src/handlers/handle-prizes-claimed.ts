import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { PrizeClaim } from '../model'
import { HandlerArgs } from '../types'

export async function handlePrizesClaimed(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { roundId, user, referrer, ticketCount, prizeAmount } =
		rips.events.PrizesClaimed.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, entities.rounds, roundIdStr)

	round.ticketsClaimed += ticketCount
	entities.rounds.set(roundIdStr, round)

	entities.prizeClaims.push(
		new PrizeClaim({
			id: log.id,
			round,
			user: user.toLowerCase(),
			referrer: referrer.toLowerCase(),
			ticketCount,
			amount: prizeAmount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
