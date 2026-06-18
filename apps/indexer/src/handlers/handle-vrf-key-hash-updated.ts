import * as rips from '../abi/rips'
import { VrfKeyHashUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleVrfKeyHashUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { newKeyHash } = rips.events.VrfKeyHashUpdated.decode(log)

	entities.vrfKeyHashUpdates.push(
		new VrfKeyHashUpdated({
			id: log.id,
			keyHash: newKeyHash,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
