import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { Refund } from '../model'
import { HandlerArgs } from '../types'

export async function handleRefundIssued(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { roundId, user, ticketCount } = rips.events.RefundIssued.decode(log)
	const roundIdStr = roundId.toString()

	const round = await resolveRoundOrThrow(ctx, entities.rounds, roundIdStr)

	round.ticketsRefunded += Number(ticketCount)
	entities.rounds.set(roundIdStr, round)

	entities.refunds.push(
		new Refund({
			id: log.id,
			round,
			user: user.toLowerCase(),
			ticketCount,
			amount: ticketCount * round.config.ticketCost,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
