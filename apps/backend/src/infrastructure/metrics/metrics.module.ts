import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { EvmRpcMetricsService } from './evm-rpc-metrics.service'
import { EVM_RPC_CALL_DURATION, EVM_RPC_CALLS_TOTAL } from './evm.metrics'
import { HttpMetricsInterceptor } from './http-metrics.interceptor'
import { HTTP_REQUEST_DURATION, HTTP_REQUESTS_TOTAL } from './http.metrics'
import { KeeperMetricsService } from './keeper-metrics.service'
import {
	EXECUTOR_NATIVE_BALANCE,
	EXECUTOR_PENDING_NONCE_GAP,
	KEEPER_ACTIONS_TOTAL,
} from './keeper.metrics'
import { PRISMA_QUERY_DURATION } from './prisma.metrics'
import { WorkerMetricsService } from './worker-metrics.service'
import { WORKER_LAST_SUCCESS, WORKER_RUN_DURATION } from './worker.metrics'

@Module({
	imports: [
		PrometheusModule.register({
			path: '/metrics',
			defaultMetrics: { enabled: true },
		}),
	],
	providers: [
		HTTP_REQUESTS_TOTAL,
		HTTP_REQUEST_DURATION,
		HttpMetricsInterceptor,
		{
			provide: APP_INTERCEPTOR,
			useClass: HttpMetricsInterceptor,
		},
		WORKER_LAST_SUCCESS,
		WORKER_RUN_DURATION,
		WorkerMetricsService,
		EVM_RPC_CALL_DURATION,
		EVM_RPC_CALLS_TOTAL,
		EvmRpcMetricsService,
		PRISMA_QUERY_DURATION,
		EXECUTOR_NATIVE_BALANCE,
		EXECUTOR_PENDING_NONCE_GAP,
		KEEPER_ACTIONS_TOTAL,
		KeeperMetricsService,
	],
	exports: [
		WorkerMetricsService,
		EvmRpcMetricsService,
		KeeperMetricsService,
		PRISMA_QUERY_DURATION,
	],
})
export class MetricsModule {}
