import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { RipCancelled } from '../model'
import { startRefund } from '../rip-status'
import { HandlerArgs } from '../types'

export async function handleRipCancelled(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { ripId } = rips.events.RipCancelled.decode(log)
	const ripIdStr = ripId.toString()

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripIdStr)

	startRefund(rip, ctx)

	entities.rips.set(ripIdStr, rip)

	entities.ripCancellations.push(
		new RipCancelled({
			id: log.id,
			rip,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
