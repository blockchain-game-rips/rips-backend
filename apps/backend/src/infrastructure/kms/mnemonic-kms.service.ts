import { Injectable } from '@nestjs/common'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
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

const CONFIG_DIR = join(process.cwd(), 'config')
const LAST_KEY_FILE = join(CONFIG_DIR, 'last-key.txt')
const INITIAL_KEY_INDEX = 1

@Injectable()
export class MnemonicKmsService extends KmsWithMetrics {
	private readonly mnemonic: string

	constructor(metrics?: KmsMetricsService) {
		super(metrics)
		this.mnemonic = getEnvSafe('KMS_MNEMONIC')
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
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true })
		}

		if (!existsSync(LAST_KEY_FILE)) {
			return INITIAL_KEY_INDEX
		}

		const lastIndex = Number(readFileSync(LAST_KEY_FILE, 'utf-8').trim())

		return lastIndex + 1
	}

	private saveKeyIndex(index: number): void {
		if (!existsSync(CONFIG_DIR)) {
			mkdirSync(CONFIG_DIR, { recursive: true })
		}

		writeFileSync(LAST_KEY_FILE, String(index), 'utf-8')
	}
}
