import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { RoundStatus, TicketPurchase } from '../model'
import { HandlerArgs } from '../types'

export async function handleTicketsPurchased(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { roundId, user, ticketCount, startTicketIndex } =
		rips.events.TicketsPurchased.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, entities.rounds, roundIdStr)

	round.ticketsSold += ticketCount

	if (round.ticketsSold === round.config.ticketCap) {
		round.status = RoundStatus.SEALED
	}

	entities.rounds.set(roundIdStr, round)

	entities.ticketPurchases.push(
		new TicketPurchase({
			id: log.id,
			round,
			user: user.toLowerCase(),
			ticketCount,
			startTicketIndex,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
