import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { HttpMetricsInterceptor } from './http-metrics.interceptor'
import { HTTP_REQUEST_DURATION, HTTP_REQUESTS_TOTAL } from './http.metrics'
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
	],
	exports: [WorkerMetricsService],
})
export class MetricsModule {}
