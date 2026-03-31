import * as rips from '../abi/rips'
import { FeeRecipientUpdated } from '../model'
import { EventContext } from '../types'

export function handleFeeRecipientUpdated(eventCtx: EventContext): void {
	const { block, log, feeRecipientUpdates } = eventCtx

	const { newRecipient } = rips.events.FeeRecipientUpdated.decode(log)

	feeRecipientUpdates.push(
		new FeeRecipientUpdated({
			id: log.id,
			feeRecipient: newRecipient.toLowerCase(),
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
