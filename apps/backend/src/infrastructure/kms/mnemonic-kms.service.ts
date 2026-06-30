import { Injectable } from '@nestjs/common'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { type Hex } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import { type KmsKeyResult } from '../../application/interfaces/kms.service'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { KmsKeyId, toKmsKeyId } from '../../domain/value-objects/kms-key-id'
import { getEnvSafe } from '../../utils/common'
import { KmsMetricsService } from '../metrics/kms-metrics.service'
import { KmsWithMetrics } from './kms-with-metrics.service'

const INITIAL_KEY_INDEX = 1

@Injectable()
export class MnemonicKmsService extends KmsWithMetrics {
	private readonly mnemonic: string
	private readonly lastKeyIndexFile: string

	constructor(metrics?: KmsMetricsService) {
		super(metrics)
		this.mnemonic = getEnvSafe('KMS_MNEMONIC')
		this.lastKeyIndexFile = getEnvSafe('KMS_LAST_KEY_INDEX_FILE')
	}

	protected async doCreateEvmKey(): Promise<KmsKeyResult> {
		const keyIndex = this.getNextKeyIndex()

		const account = mnemonicToAccount(this.mnemonic, {
			addressIndex: keyIndex,
		})

		this.saveKeyIndex(keyIndex)

		return Promise.resolve({
			kmsKeyId: toKmsKeyId(String(keyIndex)),
			evmAddress: toEvmAddress(account.address),
		})
	}

	protected async doSignTransaction(
		kmsKeyId: KmsKeyId,
		hash: Hex,
		_expectedAddress: EvmAddress,
	): Promise<Hex> {
		const keyIndex = Number(kmsKeyId)

		const account = mnemonicToAccount(this.mnemonic, {
			addressIndex: keyIndex,
		})

		return account.sign({ hash })
	}

	private getNextKeyIndex(): number {
		if (!existsSync(this.lastKeyIndexFile)) {
			return INITIAL_KEY_INDEX
		}

		const lastIndex = Number(
			readFileSync(this.lastKeyIndexFile, 'utf-8').trim(),
		)

		return lastIndex + 1
	}

	private saveKeyIndex(index: number): void {
		const dir = dirname(this.lastKeyIndexFile)

		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true })
		}

		writeFileSync(this.lastKeyIndexFile, String(index), 'utf-8')
	}
}
