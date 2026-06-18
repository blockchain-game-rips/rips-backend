import * as rips from '../abi/rips'
import { resolveReferrerRewardState } from '../helpers'
import { ReferrerFeeSeized } from '../model'
import { HandlerArgs } from '../types'

export async function handleReferrerFeeSeized(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, block, log } = args

	const { referrer, currency, amount } =
		rips.events.ReferrerFeeSeized.decode(log)

	const referrerLower = referrer.toLowerCase()
	const currencyLower = currency.toLowerCase()

	const rewardState = await resolveReferrerRewardState(
		ctx,
		entities.referrerRewards,
		referrerLower,
		currencyLower,
	)
	rewardState.seized += amount

	entities.referrerFeeSeizures.push(
		new ReferrerFeeSeized({
			id: log.id,
			referrer: referrerLower,
			currency: currencyLower,
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
