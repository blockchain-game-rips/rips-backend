import * as rips from '../abi/rips'
import { ReferrerStateUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleReferralStatsUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { referrer, currency, referrerState } =
		rips.events.ReferralStateUpdated.decode(log)

	entities.referrerStateUpdates.push(
		new ReferrerStateUpdated({
			id: log.id,
			referrer: referrer,
			currency: currency,
			activeFeePercent: referrerState.activeFeePercent,
			//TODO: do I need to multiply
			periodStartTime: new Date(
				referrerState.periodStartTimestamp.toString(),
			),
			periodVolume: referrerState.periodVolume,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
