import { Hex, isHex } from 'viem'

const PRIVATE_KEY_LENGTH = 66

export type PrivateKey = Hex & { readonly __brand: 'PrivateKey' }

export function toPrivateKey(value: string): PrivateKey {
	const normalized = value.toLowerCase()

	if (!isHex(normalized) || normalized.length !== PRIVATE_KEY_LENGTH) {
		throw new Error('Invalid private key')
	}

	return normalized as PrivateKey
}
