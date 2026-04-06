import * as rips from '../abi/rips'
import { ReferrerFeeSeized } from '../model'
import { HandlerArgs } from '../types'

export function handleReferrerFeeSeized(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { referrer, currency, amount } =
		rips.events.ReferrerFeeSeized.decode(log)

	entities.referrerFeeSeizures.push(
		new ReferrerFeeSeized({
			id: log.id,
			referrer: referrer.toLowerCase(),
			currency: currency.toLowerCase(),
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
