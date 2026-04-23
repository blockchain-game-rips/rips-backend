import * as rips from '../abi/rips'
import { ReferralStatsUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleReferralStatsUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { referralStats } = rips.events.ReferralStatsUpdated.decode(log)

	entities.referralStatsUpdates.push(
		new ReferralStatsUpdated({
			id: log.id,
			activeFeePercent: referralStats.activeFeePercent,
			customFeePercent: referralStats.customFeePercent,
			monthStartTimestamp: BigInt(referralStats.monthStartTimestamp),
			currMonthVolume: referralStats.currMonthVolume,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
