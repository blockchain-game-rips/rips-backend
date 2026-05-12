import { Injectable, Logger } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram } from 'prom-client'
import { KmsKeyResult } from '../../application/interfaces/kms.service'
import { KmsKeyId } from '../../domain/value-objects/kms-key-id'

export const KmsOperation = {
	CreateEvmKey: 'createEvmKey',
	SignTransaction: 'signTransaction',
} as const

export type KmsOperation = (typeof KmsOperation)[keyof typeof KmsOperation]

@Injectable()
export class KmsMetricsService {
	private readonly logger = new Logger(KmsMetricsService.name)

	constructor(
		@InjectMetric('kms_operation_duration_seconds')
		private readonly operationDuration: Histogram<string>,

		@InjectMetric('kms_operations_total')
		private readonly operationsTotal: Counter<string>,
	) {}

	async trackCreate(
		provider: string,
		fn: () => Promise<KmsKeyResult>,
	): Promise<KmsKeyResult> {
		return this.trackOperation(
			provider,
			KmsOperation.CreateEvmKey,
			fn,
			(result) => result.kmsKeyId,
		)
	}

	async trackSign(
		provider: string,
		keyId: KmsKeyId,
		fn: () => Promise<string>,
	): Promise<string> {
		return this.trackOperation(
			provider,
			KmsOperation.SignTransaction,
			fn,
			() => keyId,
		)
	}

	private async trackOperation<T>(
		provider: string,
		operation: KmsOperation,
		fn: () => Promise<T>,
		getKeyId: (result: T) => KmsKeyId,
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
				{ provider, keyId: getKeyId(result), operation, durationMs },
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

			this.logger.error({ provider, operation }, 'KMS operation failed')

			throw error
		}
	}
}
