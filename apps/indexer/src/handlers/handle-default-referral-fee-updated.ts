import * as rips from '../abi/rips'
import { DefaultReferralFeeUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleDefaultReferralFeeUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { newDefaultReferralFeeBps } =
		rips.events.DefaultReferralFeeUpdated.decode(log)

	entities.defaultReferralFeeUpdates.push(
		new DefaultReferralFeeUpdated({
			id: log.id,
			defaultReferralFeeBps: newDefaultReferralFeeBps,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
