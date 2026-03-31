import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { RoundStatus, TicketPurchase } from '../model'
import { EventContext } from '../types'

export async function handleTicketsPurchased(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, block, log, rounds, ticketPurchases } = eventCtx

	const { roundId, user, ticketCount, startTicketIndex } =
		rips.events.TicketsPurchased.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, rounds, roundIdStr)

	round.ticketsSold += Number(ticketCount)

	if (BigInt(round.ticketsSold) === round.stakeConfig.ticketCap) {
		round.status = RoundStatus.Sealed
	}

	rounds.set(roundIdStr, round)

	ticketPurchases.push(
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
