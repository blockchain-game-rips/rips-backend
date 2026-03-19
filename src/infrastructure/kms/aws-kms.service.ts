import {
	CreateKeyCommand,
	GetPublicKeyCommand,
	KMSClient,
} from '@aws-sdk/client-kms'
import { Injectable } from '@nestjs/common'
import {
	KmsService,
	type KmsKeyResult,
} from 'src/application/interfaces/kms.service'
import { getEnvSafe } from 'src/utils/common'
import { getAddress, keccak256, type Address, type Hex } from 'viem'

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

		const kmsKeyId = createResult.KeyMetadata!.KeyId!

		const publicKeyResult = await this.client.send(
			new GetPublicKeyCommand({ KeyId: kmsKeyId }),
		)

		const evmAddress = deriveEvmAddress(publicKeyResult.PublicKey!)

		return { kmsKeyId, evmAddress }
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async signTransaction(
		_kmsKeyId: string,
		_hash: Hex,
		_expectedAddress: Address,
	): Promise<Hex> {
		throw new Error('signTransaction is not supported for AWS KMS')
	}
}

function deriveEvmAddress(derEncodedKey: Uint8Array): Address {
	const uncompressedKey = derEncodedKey.slice(
		DER_UNCOMPRESSED_PUBLIC_KEY_OFFSET,
	)
	const hash = keccak256(uncompressedKey)
	const addressHex = '0x' + hash.slice(-40)
	return getAddress(addressHex)
}
