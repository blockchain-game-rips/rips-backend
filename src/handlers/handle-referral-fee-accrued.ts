import * as rips from '../abi/rips'
import { ReferralFeeAccrued } from '../model'
import { HandlerArgs } from '../types'

export function handleReferralFeeAccrued(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { roundId, referrer, amount } =
		rips.events.ReferralFeeAccrued.decode(log)

	entities.referralFeeAccruals.push(
		new ReferralFeeAccrued({
			id: log.id,
			roundId,
			referrer: referrer.toLowerCase(),
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
