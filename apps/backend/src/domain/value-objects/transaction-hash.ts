import { Hash, isHash } from 'viem'

export function toTransactionHash(value: string): Hash {
	if (!isHash(value)) {
		throw new Error(`Invalid transaction hash: ${value}`)
	}

	return value
}
