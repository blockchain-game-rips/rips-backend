import {
	makeCounterProvider,
	makeHistogramProvider,
} from '@willsoto/nestjs-prometheus'

export const EVM_RPC_CALL_DURATION = makeHistogramProvider({
	name: 'evm_rpc_call_duration_seconds',
	help: 'Duration of EVM RPC calls in seconds',
	labelNames: ['chain', 'method'],
	buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const EVM_RPC_CALLS_TOTAL = makeCounterProvider({
	name: 'evm_rpc_calls_total',
	help: 'Total number of EVM RPC calls, labeled by outcome',
	labelNames: ['chain', 'method', 'outcome'],
})
