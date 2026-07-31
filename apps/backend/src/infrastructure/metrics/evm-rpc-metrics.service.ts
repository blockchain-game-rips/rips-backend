import { Injectable } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram } from 'prom-client'
import {
	createTransport,
	EIP1193RequestFn,
	EIP1193RequestOptions,
	Transport,
} from 'viem'

type RpcCallArgs = { method: string; params?: unknown }

type RpcCallMetrics = {
	startTimer: (method: string) => () => void
	countOutcome: (method: string, outcome: 'success' | 'failure') => void
}

// The overload lets us expose viem's generic EIP1193RequestFn (whose return
// type is chosen by the caller per RPC method) while implementing a concrete
// pass-through — plain assignment can't relate the two signatures.
function instrumentRequest(
	inner: EIP1193RequestFn,
	metrics: RpcCallMetrics,
): EIP1193RequestFn
function instrumentRequest(
	inner: EIP1193RequestFn,
	metrics: RpcCallMetrics,
): (args: RpcCallArgs, options?: EIP1193RequestOptions) => Promise<unknown> {
	return async (args, options) => {
		const { method } = args
		const end = metrics.startTimer(method)

		try {
			const result: unknown = await inner(args, options)
			metrics.countOutcome(method, 'success')

			return result
		} catch (error) {
			metrics.countOutcome(method, 'failure')

			throw error
		} finally {
			end()
		}
	}
}

@Injectable()
export class EvmRpcMetricsService {
	constructor(
		@InjectMetric('evm_rpc_call_duration_seconds')
		private readonly callDuration: Histogram<string>,

		@InjectMetric('evm_rpc_calls_total')
		private readonly callsTotal: Counter<string>,
	) {}

	wrapTransport(transport: Transport, chain: string): Transport {
		const { callDuration, callsTotal } = this

		const metrics: RpcCallMetrics = {
			startTimer: (method) => callDuration.startTimer({ chain, method }),
			countOutcome: (method, outcome) =>
				callsTotal.inc({ chain, method, outcome }),
		}

		return (params) => {
			const inner = transport(params)

			return createTransport(
				{
					...inner.config,
					request: instrumentRequest(inner.config.request, metrics),
				},
				inner.value,
			)
		}
	}
}
