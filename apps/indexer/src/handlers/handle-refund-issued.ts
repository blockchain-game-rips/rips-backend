import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { Refund, RipStatus } from '../model'
import { applyStatus } from '../rip-status'
import { HandlerArgs } from '../types'

export async function handleRefundIssued(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { ripId, user, entryCount } = rips.events.RefundIssued.decode(log)
	const ripIdStr = ripId.toString()

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripIdStr)

	rip.entriesRefunded += entryCount

	if (rip.entriesRefunded === rip.entriesSold) {
		applyStatus(rip, RipStatus.REFUNDED, ctx)
	}

	entities.rips.set(ripIdStr, rip)

	entities.refunds.push(
		new Refund({
			id: log.id,
			rip,
			user: user.toLowerCase(),
			entryCount,
			amount: entryCount * rip.config.entryPrice,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
