import * as rips from '../abi/rips'
import { ReferrerCustomFeeSet } from '../model'
import { HandlerArgs } from '../types'

export function handleReferrerCustomFeeSet(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { referrer, customFeePercent } =
		rips.events.ReferrerCustomFeeSet.decode(log)

	entities.referrerCustomFeeUpdates.push(
		new ReferrerCustomFeeSet({
			id: log.id,
			referrer: referrer.toLowerCase(),
			customFeePercent,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
