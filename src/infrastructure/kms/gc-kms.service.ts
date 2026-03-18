import { KeyManagementServiceClient } from '@google-cloud/kms'
import { Injectable } from '@nestjs/common'
import { createPublicKey } from 'crypto'
import {
	KmsService,
	type KmsKeyResult,
} from 'src/application/interfaces/kms.service'
import { getEnvSafe } from 'src/utils/common'
import { getAddress, keccak256, type Address } from 'viem'

const UNCOMPRESSED_PUBLIC_KEY_PREFIX = 0x04
const UNCOMPRESSED_PUBLIC_KEY_LENGTH = 65

@Injectable()
export class GcKmsService extends KmsService {
	private readonly client: KeyManagementServiceClient
	private readonly projectId: string
	private readonly locationId: string
	private readonly keyRingId: string

	constructor() {
		super()
		this.client = new KeyManagementServiceClient()
		this.projectId = getEnvSafe('GC_KMS_PROJECT_ID')
		this.locationId = getEnvSafe('GC_KMS_LOCATION_ID')
		this.keyRingId = getEnvSafe('GC_KMS_KEY_RING_ID')
	}

	async createEvmKey(): Promise<KmsKeyResult> {
		const cryptoKeyId = crypto.randomUUID()

		const [key] = await this.client.createCryptoKey({
			parent: this.client.keyRingPath(
				this.projectId,
				this.locationId,
				this.keyRingId,
			),
			cryptoKeyId,
			cryptoKey: {
				purpose: 'ASYMMETRIC_SIGN',
				versionTemplate: {
					algorithm: 'EC_SIGN_SECP256K1_SHA256',
					protectionLevel: 'SOFTWARE',
				},
			},
		})

		const keyName = key.name
		if (!keyName) {
			throw new Error('GC KMS createCryptoKey returned no key name')
		}

		const versionName = `${keyName}/cryptoKeyVersions/1`

		await this.waitForKeyVersionEnabled(versionName)

		const [publicKey] = await this.client.getPublicKey({
			name: versionName,
		})
		if (!publicKey.pem) {
			throw new Error('GC KMS getPublicKey returned no PEM')
		}

		const evmAddress = deriveEvmAddressFromPem(publicKey.pem)

		return { kmsKeyId: versionName, evmAddress }
	}

	private async waitForKeyVersionEnabled(versionName: string): Promise<void> {
		const MAX_ATTEMPTS = 10
		const POLL_INTERVAL_MS = 500

		for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
			const [version] = await this.client.getCryptoKeyVersion({
				name: versionName,
			})

			if (version.state === 'ENABLED') {
				return
			}

			await new Promise((resolve) =>
				setTimeout(resolve, POLL_INTERVAL_MS),
			)
		}

		throw new Error(
			`GC KMS key version ${versionName} did not become ENABLED`,
		)
	}
}

function deriveEvmAddressFromPem(pem: string): Address {
	const publicKeyObject = createPublicKey(pem)

	const derBuffer = publicKeyObject.export({ type: 'spki', format: 'der' })

	const uncompressedKey = extractUncompressedPublicKey(derBuffer)
	const keyWithoutPrefix = uncompressedKey.subarray(1)

	const hash = keccak256(keyWithoutPrefix)
	const addressHex = '0x' + hash.slice(-40)

	return getAddress(addressHex)
}

function extractUncompressedPublicKey(derBuffer: Buffer): Buffer {
	for (let i = 0; i < derBuffer.length; i++) {
		if (
			derBuffer[i] === UNCOMPRESSED_PUBLIC_KEY_PREFIX &&
			derBuffer.length - i === UNCOMPRESSED_PUBLIC_KEY_LENGTH
		) {
			return derBuffer.subarray(i)
		}
	}

	throw new Error('Could not extract uncompressed public key from DER buffer')
}
