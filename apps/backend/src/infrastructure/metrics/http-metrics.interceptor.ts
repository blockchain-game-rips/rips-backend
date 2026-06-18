import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Request } from 'express'
import { Counter, Histogram } from 'prom-client'
import { Observable, tap } from 'rxjs'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
	constructor(
		@InjectMetric('http_requests_total')
		private readonly requestsTotal: Counter<string>,

		@InjectMetric('http_request_duration_seconds')
		private readonly requestDuration: Histogram<string>,
	) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<unknown> {
		const req = context.switchToHttp().getRequest<Request>()
		const method = req.method
		const path = this.normalizePath(req.route?.path ?? req.path)
		const end = this.requestDuration.startTimer()

		return next.handle().pipe(
			tap({
				next: () => {
					const status = context
						.switchToHttp()
						.getResponse().statusCode
					end({ method, path, status })
					this.requestsTotal.inc({ method, path, status })
				},
				error: () => {
					end({ method, path, status: 500 })
					this.requestsTotal.inc({ method, path, status: 500 })
				},
			}),
		)
	}

	private normalizePath(path: string): string {
		return path.replace(/\/[0-9a-f]{8}-[0-9a-f-]{27}/gi, '/:id')
	}
}
