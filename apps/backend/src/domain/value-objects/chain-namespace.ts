/**
 * CAIP-2 namespace — identifies a blockchain ecosystem.
 * Examples: 'eip155' (EVM), 'solana', 'cosmos'
 * @see https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md
 */
export type ChainNamespace = string & { readonly __brand: 'ChainNamespace' }

export function toChainNamespace(value: string): ChainNamespace {
	return value as ChainNamespace
}
