import { Injectable } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram } from 'prom-client'
import { Transport } from 'viem'

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

		return (params) => {
			const inner = transport(params)

			const originalRequest = inner.request.bind(inner)

			const wrappedRequest = async function (args: {
				method: string
				params?: unknown
			}) {
				const { method } = args
				const end = callDuration.startTimer({ chain, method })

				try {
					const result = await originalRequest(args)
					end()
					callsTotal.inc({ chain, method, outcome: 'success' })
					return result
				} catch (error) {
					end()
					callsTotal.inc({ chain, method, outcome: 'failure' })
					throw error
				}
			}

			return {
				...inner,
				request: wrappedRequest as typeof inner.request,
			}
		}
	}
}
