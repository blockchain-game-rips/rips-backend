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
	rips.events.PresetCreated.topic,
	rips.events.PresetUpdated.topic,
	rips.events.PresetDeleted.topic,
	rips.events.RipCreated.topic,
	rips.events.RipCancelled.topic,
	rips.events.RipEntered.topic,
	rips.events.RandomnessRequested.topic,
	rips.events.RandomnessFulfilled.topic,
	rips.events.PayoutClaimed.topic,
	rips.events.RefundIssued.topic,
	rips.events.FeeRecipientUpdated.topic,
	rips.events.CallbackGasLimitUpdated.topic,
	rips.events.VrfRequestConfirmationsUpdated.topic,
	rips.events.VrfSubscriptionIdUpdated.topic,
	rips.events.VrfKeyHashUpdated.topic,
	rips.events.ProtocolFeeWithdrawn.topic,
	rips.events.ReferrerFeeWithdrawn.topic,
	rips.events.ReferrerFeeSeized.topic,
	rips.events.ReferrerFreezeUpdated.topic,
	rips.events.ReferralTiersUpdated.topic,
	rips.events.DefaultReferralFeeUpdated.topic,
	rips.events.ReferralStateUpdated.topic,
	rips.events.ReferrerCustomFeeUpdated.topic,
	rips.events.ReferralFeeAccrued.topic,
	rips.events.ProtocolFeeAccrued.topic,
]

const gatewayUrl = process.env.GATEWAY_URL

// The v2 archive stopped serving anonymous traffic on 19 May 2026. The SDK also
// reads SQD_API_KEY on its own; naming it here keeps the requirement visible
// next to the url it authenticates.
const gatewayApiKey = process.env.SQD_API_KEY

if (!gatewayUrl) {
	console.warn(
		'GATEWAY_URL is not set — running in RPC-only mode. This is slower and not recommended for production.',
	)
} else if (!gatewayApiKey) {
	console.warn(
		'SQD_API_KEY is not set — the gateway rejects keyless traffic. Get one at https://portal.sqd.dev',
	)
}

const headPollInterval = process.env.HEAD_POLL_INTERVAL_MS

// Requests per second the processor is allowed to issue. It only bounds the RPC
// path, so it decides how fast a range the gateway cannot serve gets synced —
// the gateway trails the chain tip by weeks, which puts any recent history
// entirely on RPC.
const DEFAULT_RPC_RATE_LIMIT = 10

const rpcRateLimit = process.env.RPC_RATE_LIMIT
	? parseInt(process.env.RPC_RATE_LIMIT)
	: DEFAULT_RPC_RATE_LIMIT

const processorBuilder = new EvmBatchProcessor()
	.setRpcEndpoint({
		url: assertNotNull(process.env.RPC_ENDPOINT),
		rateLimit: rpcRateLimit,
	})
	.setRpcDataIngestionSettings(
		headPollInterval
			? { headPollInterval: parseInt(headPollInterval) }
			: {},
	)

export const processor = (
	gatewayUrl
		? processorBuilder.setGateway({
				url: gatewayUrl,
				apiKey: gatewayApiKey,
			})
		: processorBuilder
)
	.setFinalityConfirmation(75)
	.setFields({
		log: {
			topics: true,
			data: true,
			transactionHash: true,
		},
		transaction: {
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
