import { PrivateKey } from '../../domain/value-objects/private-key'

export interface EncryptedKey {
	encryptedPrivateKey: Uint8Array<ArrayBuffer>
	kekVersion: string
}

export abstract class EncryptionService {
	abstract encrypt(privateKey: PrivateKey): Promise<EncryptedKey>
	abstract decrypt(encryptedKey: EncryptedKey): Promise<PrivateKey>
}
