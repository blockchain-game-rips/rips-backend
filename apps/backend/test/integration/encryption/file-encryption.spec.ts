import { generatePrivateKey } from 'viem/accounts'
import { toPrivateKey } from '../../../src/domain/value-objects/private-key'
import { FileEncryptionService } from '../../../src/infrastructure/encryption/file-encryption.service'
import { provisionKekFile } from '../../utils/kek'

describe('FileEncryptionService integration', () => {
	let encryptionService: FileEncryptionService

	beforeAll(() => {
		provisionKekFile()

		encryptionService = new FileEncryptionService()
	})

	it('round-trips a private key through encrypt and decrypt', async () => {
		const privateKey = toPrivateKey(generatePrivateKey())

		const encryptedKey = await encryptionService.encrypt(privateKey)
		const decrypted = await encryptionService.decrypt(encryptedKey)

		expect(decrypted).toBe(privateKey)
	})

	it('produces a distinct ciphertext per encryption', async () => {
		const privateKey = toPrivateKey(generatePrivateKey())

		const first = await encryptionService.encrypt(privateKey)
		const second = await encryptionService.encrypt(privateKey)

		expect(first.encryptedPrivateKey).not.toEqual(
			second.encryptedPrivateKey,
		)
	})

	it('fails to decrypt when the ciphertext is tampered', async () => {
		const privateKey = toPrivateKey(generatePrivateKey())

		const encryptedKey = await encryptionService.encrypt(privateKey)
		encryptedKey.encryptedPrivateKey[
			encryptedKey.encryptedPrivateKey.length - 1
		] ^= 1

		expect(() => encryptionService.decrypt(encryptedKey)).toThrow()
	})
})
