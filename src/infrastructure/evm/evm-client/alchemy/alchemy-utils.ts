import { CHAIN_ID_TO_CHAIN_KEY } from './constants'

export function getAlchemyApiKey() {
	const apiKey = process.env.ALCHEMY_API_KEY
	if (!apiKey) {
		throw new Error('ALCHEMY_API_KEY is not set')
	}
	return apiKey
}

export function getAlchemyRpcUrl(chainId: number) {
	const apiKey = getAlchemyApiKey()

	const chainKey = CHAIN_ID_TO_CHAIN_KEY[chainId]

	if (!chainKey) {
		throw new Error(`Chain ID ${chainId} not found in alchemy networks`)
	}

	return `https://${chainKey}.g.alchemy.com/v2/${apiKey}` as const
}
