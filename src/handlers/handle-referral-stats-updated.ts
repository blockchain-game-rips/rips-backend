import * as rips from '../abi/rips'
import { ReferrerStateUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleReferralStatsUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { referrer, referrerState } =
		rips.events.ReferralStatsUpdated.decode(log)

	entities.referrerStateUpdates.push(
		new ReferrerStateUpdated({
			id: log.id,
			referrer: referrer,
			activeFeePercent: referrerState.activeFeePercent,
			customFeePercent: referrerState.customFeePercent,
			monthStartTime: BigInt(referrerState.monthStartTimestamp),
			currMonthVolume: referrerState.currMonthVolume,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
