import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { EntryPurchase, RipStatus } from '../model'
import { applyStatus } from '../rip-status'
import { HandlerArgs } from '../types'

export async function handleEntriesPurchased(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { ripId, user, entryCount, startEntryIndex } =
		rips.events.RipEntered.decode(log)
	const ripIdStr = ripId.toString()

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripIdStr)

	rip.entriesSold += entryCount

	if (rip.entriesSold === rip.config.entryCap) {
		applyStatus(rip, RipStatus.SEALED, ctx)
	}

	entities.rips.set(ripIdStr, rip)

	entities.entryPurchases.push(
		new EntryPurchase({
			id: log.id,
			rip,
			user: user.toLowerCase(),
			entryCount,
			startEntryIndex,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
