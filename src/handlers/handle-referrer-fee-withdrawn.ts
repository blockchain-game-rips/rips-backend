import * as rips from '../abi/rips'
import { ReferrerFeeWithdrawn } from '../model'
import { HandlerArgs } from '../types'

export function handleReferrerFeeWithdrawn(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { referrer, currency, amount } =
		rips.events.ReferrerFeeWithdrawn.decode(log)

	entities.referrerFeeWithdrawals.push(
		new ReferrerFeeWithdrawn({
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
