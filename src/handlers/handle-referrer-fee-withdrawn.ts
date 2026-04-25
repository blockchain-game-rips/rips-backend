import * as rips from '../abi/rips'
import { resolveReferrerRewardState } from '../helpers'
import { ReferrerFeeWithdrawn } from '../model'
import { HandlerArgs } from '../types'

export async function handleReferrerFeeWithdrawn(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { referrer, currency, amount } =
		rips.events.ReferrerFeeWithdrawn.decode(log)

	const referrerLower = referrer.toLowerCase()
	const currencyLower = currency.toLowerCase()

	const rewardState = await resolveReferrerRewardState(ctx, entities.referrerRewardStates, referrerLower, currencyLower)
	rewardState.withdrawn += amount

	entities.referrerFeeWithdrawals.push(
		new ReferrerFeeWithdrawn({
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
