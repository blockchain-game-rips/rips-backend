import * as rips from '../abi/rips'
import { CallbackGasLimitUpdated } from '../model'
import { HandlerArgs } from '../types'

export function handleCallbackGasLimitUpdated(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { newLimit } = rips.events.CallbackGasLimitUpdated.decode(log)

	entities.callbackGasLimitUpdates.push(
		new CallbackGasLimitUpdated({
			id: log.id,
			callbackGasLimit: newLimit,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
