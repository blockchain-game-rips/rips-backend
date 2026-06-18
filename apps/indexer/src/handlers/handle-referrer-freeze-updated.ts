import * as rips from '../abi/rips'
import { ReferrerFreezeUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleReferrerFreezeUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { referrer, frozen } = rips.events.ReferrerFreezeUpdated.decode(log)

	entities.referrerFreezeUpdates.push(
		new ReferrerFreezeUpdated({
			id: log.id,
			referrer: referrer.toLowerCase(),
			frozen,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
