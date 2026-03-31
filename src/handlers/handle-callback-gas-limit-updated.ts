import * as rips from '../abi/rips'
import { CallbackGasLimitUpdated } from '../model'
import { EventContext } from '../types'

export function handleCallbackGasLimitUpdated(eventCtx: EventContext): void {
	const { block, log, callbackGasLimitUpdates } = eventCtx

	const { newLimit } = rips.events.CallbackGasLimitUpdated.decode(log)

	callbackGasLimitUpdates.push(
		new CallbackGasLimitUpdated({
			id: log.id,
			callbackGasLimit: newLimit,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
