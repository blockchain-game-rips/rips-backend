import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { HttpMetricsInterceptor } from './http-metrics.interceptor'
import { HTTP_REQUEST_DURATION, HTTP_REQUESTS_TOTAL } from './http.metrics'

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
	],
})
export class MetricsModule {}
