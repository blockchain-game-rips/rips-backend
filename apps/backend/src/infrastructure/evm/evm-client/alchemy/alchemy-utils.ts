import { CHAIN_ID_TO_CHAIN_KEY } from './constants'

export function readAlchemyApiKey(): string | undefined {
	return process.env.ALCHEMY_API_KEY || undefined
}

export function getAlchemyRpcUrl(chainId: number, apiKey: string) {
	const chainKey = CHAIN_ID_TO_CHAIN_KEY[chainId]

	if (!chainKey) {
		throw new Error(`Chain ID ${chainId} not found in alchemy networks`)
	}

	return `https://${chainKey}.g.alchemy.com/v2/${apiKey}` as const
}

export function getAlchemyPortfolioUrl(apiKey: string) {
	return `https://api.g.alchemy.com/data/v1/${apiKey}/assets/tokens/by-address` as const
}

export function getAlchemyNetwork(chainId: number): string | undefined {
	return CHAIN_ID_TO_CHAIN_KEY[chainId]
}
