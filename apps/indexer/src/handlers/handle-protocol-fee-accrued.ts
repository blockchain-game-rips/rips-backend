import * as rips from '../abi/rips'
import { resolveRipOrThrow } from '../helpers'
import { ProtocolFeeAccrued } from '../model'
import { HandlerArgs } from '../types'

export async function handleProtocolFeeAccrued(
	args: HandlerArgs,
): Promise<void> {
	const { ctx, entities, block, log } = args

	const { ripId, amount } = rips.events.ProtocolFeeAccrued.decode(log)

	const rip = await resolveRipOrThrow(ctx, entities.rips, ripId.toString())

	entities.protocolFeeAccruals.push(
		new ProtocolFeeAccrued({
			id: log.id,
			rip,
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
