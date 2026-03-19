import { ChainNamespace } from './chain-namespace'

export type Wallet = {
	/** Maps a chain namespace (e.g. 'eip155') to a single address shared across all chains in that namespace. */
	namespaceToAddress: Record<ChainNamespace, string>
}
