import * as rips from '../abi/rips'
import { VrfSubscriptionIdUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleVrfSubscriptionIdUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { newSubscriptionId } =
		rips.events.VrfSubscriptionIdUpdated.decode(log)

	entities.vrfSubscriptionIdUpdates.push(
		new VrfSubscriptionIdUpdated({
			id: log.id,
			subscriptionId: newSubscriptionId,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
