import * as rips from '../abi/rips'
import { FeeRecipientUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleFeeRecipientUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { newRecipient } = rips.events.FeeRecipientUpdated.decode(log)

	entities.feeRecipientUpdates.push(
		new FeeRecipientUpdated({
			id: log.id,
			feeRecipient: newRecipient.toLowerCase(),
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
