import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { Refund, RoundStatus } from '../model'
import { EventContext } from '../types'

export async function handleRefundIssued(
	eventCtx: EventContext,
): Promise<void> {
	const { ctx, block, log, rounds, refunds } = eventCtx

	const { roundId, user, ticketCount } = rips.events.RefundIssued.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, rounds, roundIdStr)

	round.ticketsRefunded += Number(ticketCount)

	if (round.ticketsRefunded === round.ticketsSold) {
		round.status = RoundStatus.Refunded
	}

	rounds.set(roundIdStr, round)

	refunds.push(
		new Refund({
			id: log.id,
			round,
			user: user.toLowerCase(),
			ticketCount,
			amount: ticketCount * round.stakeConfig.ticketCost,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
