import * as rips from '../abi/rips'
import { resolveRoundOrThrow } from '../helpers'
import { ProtocolFeeAccrued } from '../model'
import { HandlerArgs } from '../types'

export async function handleProtocolFeeAccrued(args: HandlerArgs): Promise<void> {
	const { ctx, entities, block, log } = args

	const { roundId, amount } = rips.events.ProtocolFeeAccrued.decode(log)

	const round = await resolveRoundOrThrow(ctx, entities.rounds, roundId.toString())

	entities.protocolFeeAccruals.push(
		new ProtocolFeeAccrued({
			id: log.id,
			round,
			amount,
			blockNumber: BigInt(block.height),
			time: new Date(block.timestamp),
			txHash: log.transactionHash,
		}),
	)
}
