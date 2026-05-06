import {
	KmsKeyResult,
	KmsService,
} from '../../application/interfaces/kms.service'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../domain/value-objects/kms-key-id'
import { KmsMetricsService } from '../metrics/kms-metrics.service'

const UNKNOWN_KEY_ID = 'unknown'

export abstract class KmsWithMetrics extends KmsService {
	constructor(private readonly metrics?: KmsMetricsService) {
		super()
	}

	async createEvmKey(): Promise<KmsKeyResult> {
		const provider = this.constructor.name

		if (!this.metrics) return this.doCreateEvmKey()

		return this.metrics.track(
			provider,
			'createEvmKey',
			//TODO: wtf unknown?
			UNKNOWN_KEY_ID,
			() => this.doCreateEvmKey(),
		)
	}

	async signTransaction(
		kmsKeyId: KmsKeyId,
		hash: string,
		expectedAddress: EvmAddress,
	): Promise<string> {
		const provider = this.constructor.name

		if (!this.metrics)
			return this.doSignTransaction(kmsKeyId, hash, expectedAddress)

		return this.metrics.track(provider, 'signTransaction', kmsKeyId, () =>
			this.doSignTransaction(kmsKeyId, hash, expectedAddress),
		)
	}

	protected abstract doCreateEvmKey(): Promise<KmsKeyResult>

	protected abstract doSignTransaction(
		kmsKeyId: KmsKeyId,
		hash: string,
		expectedAddress: EvmAddress,
	): Promise<string>
}
