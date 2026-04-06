import * as rips from '../abi/rips'
import { ProtocolFeeWithdrawn } from '../model'
import { HandlerArgs } from '../types'

export function handleProtocolFeeWithdrawn(args: HandlerArgs): void {
	const { entities, block, log } = args

	const { recipient, currency, amount } =
		rips.events.ProtocolFeeWithdrawn.decode(log)

	entities.protocolFeeWithdrawals.push(
		new ProtocolFeeWithdrawn({
			id: log.id,
			recipient: recipient.toLowerCase(),
			currency: currency.toLowerCase(),
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
