import { Injectable } from '@nestjs/common'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { readFileSync } from 'fs'
import {
	EncryptedKey,
	EncryptionService,
} from '../../application/interfaces/encryption.service'
import {
	PrivateKey,
	toPrivateKey,
} from '../../domain/value-objects/private-key'
import { getEnvSafe } from '../../utils/common'

const ALGORITHM = 'aes-256-gcm'
const KEK_VERSION = 'file-v1'

const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEK_LENGTH = 32

@Injectable()
export class FileEncryptionService extends EncryptionService {
	private readonly kek: Buffer

	constructor() {
		super()

		this.kek = this.loadKek()
	}

	async encrypt(privateKey: PrivateKey): Promise<EncryptedKey> {
		const iv = randomBytes(IV_LENGTH)
		const cipher = createCipheriv(ALGORITHM, this.kek, iv)

		const ciphertext = Buffer.concat([
			cipher.update(privateKey, 'utf-8'),
			cipher.final(),
		])

		const authTag = cipher.getAuthTag()

		const payload = Buffer.concat([iv, authTag, ciphertext])

		const encryptedPrivateKey = new Uint8Array(payload.length)
		encryptedPrivateKey.set(payload)

		return { encryptedPrivateKey, kekVersion: KEK_VERSION }
	}

	async decrypt(encryptedKey: EncryptedKey): Promise<PrivateKey> {
		const payload = encryptedKey.encryptedPrivateKey

		const iv = payload.subarray(0, IV_LENGTH)
		const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
		const ciphertext = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

		const decipher = createDecipheriv(ALGORITHM, this.kek, iv)
		decipher.setAuthTag(authTag)

		const plaintext = Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]).toString('utf-8')

		return toPrivateKey(plaintext)
	}

	private loadKek(): Buffer {
		const path = getEnvSafe('KEK_FILE')
		const raw = readFileSync(path, 'utf-8').trim()

		const kek = Buffer.from(raw, 'hex')

		if (kek.length !== KEK_LENGTH) {
			throw new Error(
				`KEK must be ${KEK_LENGTH} bytes (${KEK_LENGTH * 2} hex chars)`,
			)
		}

		return kek
	}
}
