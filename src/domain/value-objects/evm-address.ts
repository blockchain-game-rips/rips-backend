import { getAddress } from 'viem'

export type EvmAddress = `0x${string}` & { readonly __brand: 'EvmAddress' }

export function toEvmAddress(value: string): EvmAddress {
	return getAddress(value) as EvmAddress
}
