import { Injectable } from '@nestjs/common'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname } from 'path'
import { type Hex } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { type KmsKeyResult } from '../../application/interfaces/kms.service'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { KmsKeyId, toKmsKeyId } from '../../domain/value-objects/kms-key-id'
import { getEnvSafe } from '../../utils/common'
import { KmsMetricsService } from '../metrics/kms-metrics.service'
import { KmsWithMetrics } from './kms-with-metrics.service'

interface StoredKey {
	privateKey: Hex
	address: EvmAddress
	createdAt: string
}

interface KeyStore {
	keys: Record<string, StoredKey>
}

const EMPTY_STORE: KeyStore = { keys: {} }

@Injectable()
export class FileKmsService extends KmsWithMetrics {
	private readonly storeFile: string

	constructor(metrics?: KmsMetricsService) {
		super(metrics)
		this.storeFile = getEnvSafe('KMS_STORE_FILE')
	}

	protected async doCreateEvmKey(): Promise<KmsKeyResult> {
		return this.storeKey(generatePrivateKey())
	}

	protected async doImportEvmKey(privateKey: Hex): Promise<KmsKeyResult> {
		return this.storeKey(privateKey)
	}

	private storeKey(privateKey: Hex): KmsKeyResult {
		const account = privateKeyToAccount(privateKey)
		const address = toEvmAddress(account.address)

		const store = this.readStore()

		store.keys[address] = {
			privateKey,
			address,
			createdAt: new Date().toISOString(),
		}

		this.writeStore(store)

		return {
			kmsKeyId: toKmsKeyId(address),
			evmAddress: address,
		}
	}

	protected async doSignTransaction(
		kmsKeyId: KmsKeyId,
		hash: Hex,
		expectedAddress: EvmAddress,
	): Promise<Hex> {
		const store = this.readStore()
		const stored = store.keys[kmsKeyId]

		if (!stored) {
			throw new Error(`No key found for kmsKeyId: ${kmsKeyId}`)
		}

		if (stored.address !== expectedAddress) {
			throw new Error(
				`Address mismatch for kmsKeyId ${kmsKeyId}: expected ${expectedAddress}, stored ${stored.address}`,
			)
		}

		const account = privateKeyToAccount(stored.privateKey)

		return account.sign({ hash })
	}

	private readStore(): KeyStore {
		if (!existsSync(this.storeFile)) {
			return structuredClone(EMPTY_STORE)
		}

		const raw = readFileSync(this.storeFile, 'utf-8')

		return JSON.parse(raw)
	}

	private writeStore(store: KeyStore): void {
		const dir = dirname(this.storeFile)

		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true })
		}

		writeFileSync(this.storeFile, JSON.stringify(store, null, 2), 'utf-8')
	}
}
