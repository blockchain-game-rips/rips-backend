import {
	BlockHeader,
	DataHandlerContext,
	EvmBatchProcessor,
	EvmBatchProcessorFields,
	Log as _Log,
	Transaction as _Transaction,
} from '@subsquid/evm-processor'
import { Store } from '@subsquid/typeorm-store'
import { assertNotNull } from '@subsquid/util-internal'
import * as rips from './abi/rips'

export const CONTRACT_ADDRESS = assertNotNull(
	process.env.CONTRACT_ADDRESS,
).toLowerCase()
export const CONTRACT_DEPLOYED_AT = parseInt(
	assertNotNull(process.env.CONTRACT_DEPLOYED_AT),
)

const TRACKED_EVENTS = [
	rips.events.StakeCreated.topic,
	rips.events.StakeDeleted.topic,
	rips.events.RoundCreated.topic,
	rips.events.TicketsPurchased.topic,
	rips.events.RandomnessRequested.topic,
	rips.events.RoundFinalized.topic,
	rips.events.PrizesClaimed.topic,
	rips.events.RefundIssued.topic,
	rips.events.ProtocolFeeUpdated.topic,
	rips.events.FeeRecipientUpdated.topic,
	rips.events.CallbackGasLimitUpdated.topic,
]

export const processor = new EvmBatchProcessor()
	.setGateway(assertNotNull(process.env.GATEWAY_URL))
	.setRpcEndpoint({
		url: assertNotNull(process.env.RPC_ENDPOINT),
		rateLimit: 10,
	})
	.setFinalityConfirmation(75)
	.setFields({
		log: {
			topics: true,
			data: true,
		},
		transaction: {
			hash: true,
			input: true,
		},
	})
	.addLog({
		address: [CONTRACT_ADDRESS],
		topic0: TRACKED_EVENTS,
		transaction: true,
	})
	.setBlockRange({ from: CONTRACT_DEPLOYED_AT })

export type Fields = EvmBatchProcessorFields<typeof processor>
export type Context = DataHandlerContext<Store, Fields>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
