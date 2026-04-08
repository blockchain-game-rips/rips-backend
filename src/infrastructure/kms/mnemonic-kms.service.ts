import { Injectable } from '@nestjs/common'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
	KmsService,
	type KmsKeyResult,
} from 'src/application/interfaces/kms.service'
import { KmsKeyId, toKmsKeyId } from 'src/domain/value-objects/kms-key-id'
import { getEnvSafe } from 'src/utils/common'
import { type Address, type Hex } from 'viem'
import { mnemonicToAccount } from 'viem/accounts'

const CONFIG_DIR = join(process.cwd(), 'config')
const LAST_KEY_FILE = join(CONFIG_DIR, 'last-key.txt')
const INITIAL_KEY_INDEX = 1

@Injectable()
export class MnemonicKmsService extends KmsService {
	private readonly mnemonic: string

	constructor() {
		super()
		this.mnemonic = getEnvSafe('KMS_MNEMONIC')
	}

	async createEvmKey(): Promise<KmsKeyResult> {
		const keyIndex = this.getNextKeyIndex()

		const account = mnemonicToAccount(this.mnemonic, {
			addressIndex: keyIndex,
		})

		this.saveKeyIndex(keyIndex)

		return Promise.resolve({
			kmsKeyId: toKmsKeyId(String(keyIndex)),
			evmAddress: account.address,
		})
	}

	async signTransaction(
		kmsKeyId: KmsKeyId,
		hash: Hex,
		_expectedAddress: Address,
	): Promise<Hex> {
		const keyIndex = Number(kmsKeyId)

		const account = mnemonicToAccount(this.mnemonic, {
			addressIndex: keyIndex,
		})

		const signature = await account.sign({ hash })

		return signature
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
