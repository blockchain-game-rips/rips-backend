import { Injectable, Logger } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram } from 'prom-client'

@Injectable()
export class KmsMetricsService {
	private readonly logger = new Logger(KmsMetricsService.name)

	constructor(
		@InjectMetric('kms_operation_duration_seconds')
		private readonly operationDuration: Histogram<string>,

		@InjectMetric('kms_operations_total')
		private readonly operationsTotal: Counter<string>,
	) {}

	async track<T>(
		provider: string,
		operation: string,
		keyId: string,
		fn: () => Promise<T>,
	): Promise<T> {
		const end = this.operationDuration.startTimer({ provider, operation })

		try {
			const result = await fn()

			const durationMs = Math.round(end({ provider, operation }) * 1000)

			this.operationsTotal.inc({
				provider,
				operation,
				outcome: 'success',
			})

			this.logger.log(
				{ provider, keyId, operation, durationMs },
				'KMS operation succeeded',
			)

			return result
		} catch (error) {
			end({ provider, operation })

			this.operationsTotal.inc({
				provider,
				operation,
				outcome: 'failure',
			})

			this.logger.error(
				{ provider, keyId, operation },
				'KMS operation failed',
			)

			throw error
		}
	}
}
