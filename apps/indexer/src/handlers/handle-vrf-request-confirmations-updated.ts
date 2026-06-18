import * as rips from '../abi/rips'
import { VrfRequestConfirmationsUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleVrfRequestConfirmationsUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { newConfirmations } =
		rips.events.VrfRequestConfirmationsUpdated.decode(log)

	entities.vrfRequestConfirmationsUpdates.push(
		new VrfRequestConfirmationsUpdated({
			id: log.id,
			confirmations: newConfirmations,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
