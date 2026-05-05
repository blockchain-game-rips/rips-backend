import { ChainNamespace } from './chain-namespace'

type WalletBase = {
	/** Maps a chain namespace (e.g. 'eip155') to a single address shared across all chains in that namespace. */
	namespaceToAddress: Record<ChainNamespace, string>
}

export type UserWallet = {
	kind: 'user'
} & WalletBase

export type ExecutorWallet = {
	kind: 'executor'
} & WalletBase

export type AdminWallet = {
	kind: 'admin'
} & WalletBase

export type Wallet = UserWallet | ExecutorWallet | AdminWallet
