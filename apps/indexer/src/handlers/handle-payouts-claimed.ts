import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { PayoutClaim, RipStatus } from '../model'
import { applyStatus } from '../rip-status'
import { HandlerArgs } from '../types'

export async function handlePayoutsClaimed(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { ripId, user, referrer, entryCount, payoutAmount } =
		rips.events.PayoutClaimed.decode(log)
	const ripIdStr = ripId.toString()

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripIdStr)

	rip.entriesClaimed += entryCount

	if (rip.entriesClaimed === rip.config.entryCap) {
		applyStatus(rip, RipStatus.CLAIMED, ctx)
	}

	entities.rips.set(ripIdStr, rip)

	entities.payoutClaims.push(
		new PayoutClaim({
			id: log.id,
			rip,
			user: user.toLowerCase(),
			referrer: referrer.toLowerCase(),
			entryCount,
			amount: payoutAmount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
