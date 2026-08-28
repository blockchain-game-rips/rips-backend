import { Chain } from 'viem'

export type RpcUrl = `http${string}`
export type ChainRpcSettings = {
	rpcUrls: (RpcUrl | 'alchemy')[]
	disableDefaultRpcUrl: boolean
	batchSize?: number
}
export type RpcSettings = Record<string, ChainRpcSettings>

export type CustomChain = {
	chainId: number
	defaultRpcUrl: string
	chainName: string
	nativeCurrency: {
		name: string
		symbol: string
		decimals: number
	}
}

export interface ChainClientConfig {
	rpcSettings?: RpcSettings
	customChains?: CustomChain[]
}

export type ResolvedChainRpcSettings = {
	rpcUrls: RpcUrl[]
	disableDefaultRpcUrl: boolean
	batchSize?: number
}

export type ResolvedEvmClientConfig = {
	rpcSettings?: Record<number, ResolvedChainRpcSettings>
	customChains?: Chain[]
}

export const EVM_CLIENT_CONFIG = Symbol('EVM_CLIENT_CONFIG')

export const ALCHEMY_API_KEY = Symbol('ALCHEMY_API_KEY')
