import * as rips from '../abi/rips'
import { ProtocolFeeAccrued } from '../model'
import { HandlerArgs } from '../types'

export function handleProtocolFeeAccrued(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { roundId, amount } = rips.events.ProtocolFeeAccrued.decode(log)

	entities.protocolFeeAccruals.push(
		new ProtocolFeeAccrued({
			id: log.id,
			roundId,
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
