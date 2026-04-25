import * as rips from '../abi/rips'
import { resolveReferrerRewardState, resolveRoundOrThrow } from '../helpers'
import { ReferralFeeAccrued } from '../model'
import { HandlerArgs } from '../types'

export async function handleReferralFeeAccrued(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, block, log } = args

	const { roundId, referrer, amount } =
		rips.events.ReferralFeeAccrued.decode(log)

	const referrerLower = referrer.toLowerCase()
	const round = await resolveRoundOrThrow(
		ctx,
		entities.rounds,
		roundId.toString(),
	)
	const currency = round.config.currency

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
			round,
			referrer: referrerLower,
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
