import * as rips from '../abi/rips'
import { ReferrerCustomFeeUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleReferrerCustomFeeUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { referrer, customFeePercent } =
		rips.events.ReferrerCustomFeeUpdated.decode(log)

	entities.referrerCustomFeeUpdates.push(
		new ReferrerCustomFeeUpdated({
			id: log.id,
			referrer: referrer,
			customFeePercent: customFeePercent,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
