import {
	CreateKeyCommand,
	GetPublicKeyCommand,
	KMSClient,
} from '@aws-sdk/client-kms'
import { Injectable } from '@nestjs/common'
import { keccak256, type Hex } from 'viem'
import {
	KmsService,
	type KmsKeyResult,
} from '../../application/interfaces/kms.service'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { KmsKeyId, toKmsKeyId } from '../../domain/value-objects/kms-key-id'
import { getEnvSafe } from '../../utils/common'

const DER_UNCOMPRESSED_PUBLIC_KEY_OFFSET = 27

@Injectable()
export class AwsKmsService extends KmsService {
	private readonly client: KMSClient

	constructor() {
		super()
		this.client = new KMSClient({ region: getEnvSafe('AWS_REGION') })
	}

	async createEvmKey(): Promise<KmsKeyResult> {
		const createResult = await this.client.send(
			new CreateKeyCommand({
				KeySpec: 'ECC_SECG_P256K1',
				KeyUsage: 'SIGN_VERIFY',
				Description: 'RIPS user EVM key',
			}),
		)

		const kmsKeyId = toKmsKeyId(createResult.KeyMetadata!.KeyId!)

		const publicKeyResult = await this.client.send(
			new GetPublicKeyCommand({ KeyId: kmsKeyId }),
		)

		const evmAddress = deriveEvmAddress(publicKeyResult.PublicKey!)

		return { kmsKeyId, evmAddress }
	}

	async importEvmKey(_privateKey: Hex): Promise<KmsKeyResult> {
		// TODO: implement key import for AWS KMS
		throw new Error('importEvmKey is not supported for AWS KMS')
	}

	async signTransaction(
		_kmsKeyId: KmsKeyId,
		_hash: Hex,
		_expectedAddress: EvmAddress,
	): Promise<Hex> {
		throw new Error('signTransaction is not supported for AWS KMS')
	}
}

function deriveEvmAddress(derEncodedKey: Uint8Array): EvmAddress {
	const uncompressedKey = derEncodedKey.slice(
		DER_UNCOMPRESSED_PUBLIC_KEY_OFFSET,
	)
	const hash = keccak256(uncompressedKey)
	const addressHex = '0x' + hash.slice(-40)
	return toEvmAddress(addressHex)
}
