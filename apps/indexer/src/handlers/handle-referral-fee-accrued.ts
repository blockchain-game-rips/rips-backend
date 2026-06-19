import * as rips from '../abi/rips'
import { resolveReferrerRewardState, resolveRipOrThrow } from '../helpers'
import { ReferralFeeAccrued } from '../model'
import { HandlerArgs } from '../types'

export async function handleReferralFeeAccrued(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, block, log } = args

	const { ripId, referrer, amount } =
		rips.events.ReferralFeeAccrued.decode(log)

	const referrerLower = referrer.toLowerCase()
	const rip = await resolveRipOrThrow(ctx, entities.rips, ripId.toString())
	const currency = rip.config.currency

	const rewardState = await resolveReferrerRewardState(
		ctx,
		entities.referrerRewards,
		referrerLower,
		currency,
	)
	rewardState.accrued += amount

	entities.referralFeeAccruals.push(
		new ReferralFeeAccrued({
			id: log.id,
			rip,
			referrer: referrerLower,
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
