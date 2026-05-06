import { Address, getAddress } from 'viem'
import * as chains from 'viem/chains'
import { EIP155 } from '../../../../constants'
import { CurrencyMetadata } from '../../../../domain/entities/currency'
import { composeChainId } from '../../../../domain/services/chain-id-utils'
import { composeCurrencyId } from '../../../../domain/services/currency-id-utils'
import { CurrencyId } from '../../../../domain/value-objects/currency-id'

export const NATIVE_ADDRESS: Address =
	'0x0000000000000000000000000000000000000000'

export const ETH_METADATA = {
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
}

function createMetadata(
	symbol: string,
	name: string,
	decimals = 18,
): CurrencyMetadata {
	return {
		symbol,
		name,
		decimals,
	}
}

export const NATIVE_CURRENCIES: Record<number, CurrencyMetadata> = {
	[chains.mainnet.id]: ETH_METADATA,
	[chains.arbitrum.id]: ETH_METADATA,
	[chains.optimism.id]: ETH_METADATA,
	[chains.base.id]: ETH_METADATA,
	[chains.swellchain.id]: ETH_METADATA,
	[chains.hemi.id]: ETH_METADATA,
	[chains.lightlinkPhoenix.id]: ETH_METADATA,
	[chains.bob.id]: ETH_METADATA,
	[chains.fuse.id]: createMetadata('FUSE', 'FUSE', 18),
	[chains.story.id]: createMetadata('IP', 'IP', 18),
	[chains.bsc.id]: createMetadata('BNB', 'BNB', 18),
	[chains.polygon.id]: createMetadata('POL', 'POL', 18),
	[chains.avalanche.id]: createMetadata('AVAX', 'Avalanche', 18),
	[chains.monad.id]: createMetadata('MON', 'MON', 18),
	[chains.corn.id]: createMetadata('BTCN', 'BTCN', 18),
	[chains.apeChain.id]: createMetadata('APE', 'APE', 18),
} as const

const WRAPPED_TOKENS_RAW: Record<number, Address> = {
	[chains.mainnet.id]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
	[chains.arbitrum.id]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
	[chains.optimism.id]: '0x4200000000000000000000000000000000000006',
	[chains.base.id]: '0x4200000000000000000000000000000000000006',
	[chains.polygon.id]: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
	[chains.avalanche.id]: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
	[chains.lightlinkPhoenix.id]: '0x7EbeF2A4b1B09381Ec5B9dF8C5c6f2dBECA59c73',
	[chains.hemi.id]: '0x4200000000000000000000000000000000000006',
	[chains.fuse.id]: '0x0BE9e53fd7EDaC9F859882AfdDa116645287C629',
	[chains.story.id]: '0x1514000000000000000000000000000000000000',
	[chains.bsc.id]: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
	[chains.gravity.id]: '0xBB859E225ac8Fb6BE1C7e38D87b767e95Fef0EbD',
	[chains.swellchain.id]: '0x4200000000000000000000000000000000000006',
	[chains.superposition.id]: '0x1fB719f10b56d7a85DCD32f27f897375fB21cfdd',
	[chains.bob.id]: '0x4200000000000000000000000000000000000006',
	[chains.monad.id]: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A',
	[chains.corn.id]: '0xda5ddd7270381a7c2717ad10d1c0ecb19e3cdfb2',
	[chains.apeChain.id]: '0x48b62137EdfA95a428D35C09E44256a739F6B557',
}
export const WRAPPED_TOKENS: Record<number, Address | undefined> = (() => {
	const wrappedTokensCheckSum = {}

	for (const [chainId, address] of Object.entries(WRAPPED_TOKENS_RAW)) {
		wrappedTokensCheckSum[chainId] = getAddress(address)
	}

	return wrappedTokensCheckSum
})()

export const KNOWN_TOKENS: Map<CurrencyId, CurrencyMetadata> = new Map([
	// Ethereum
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.mainnet.id.toString()),
			getAddress('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'),
		),
		{ symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.mainnet.id.toString()),
			getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
		),
		{ symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.mainnet.id.toString()),
			getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
		),
		{ symbol: 'USDC', name: 'USD Coin', decimals: 6 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.mainnet.id.toString()),
			getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
		),
		{ symbol: 'USDT', name: 'Tether USD', decimals: 6 },
	],

	// BNB Smart Chain
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.bsc.id.toString()),
			getAddress('0x0555E30da8f98308EdB960aa94C0Db47230d2B9c'),
		),
		{ symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.bsc.id.toString()),
			getAddress('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'),
		),
		{ symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.bsc.id.toString()),
			getAddress('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'),
		),
		{ symbol: 'USDC', name: 'USD Coin', decimals: 18 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.bsc.id.toString()),
			getAddress('0x55d398326f99059fF775485246999027B3197955'),
		),
		{ symbol: 'USDT', name: 'Tether USD', decimals: 18 },
	],

	// Polygon
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.polygon.id.toString()),
			getAddress('0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'),
		),
		{ symbol: 'WBTC', name: '(PoS) Wrapped BTC', decimals: 8 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.polygon.id.toString()),
			getAddress('0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'),
		),
		{
			symbol: 'WPOL',
			name: 'Wrapped Polygon Ecosystem Token',
			decimals: 18,
		},
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.polygon.id.toString()),
			getAddress('0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
		),
		{ symbol: 'USDC', name: 'USD Coin', decimals: 6 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.polygon.id.toString()),
			getAddress('0xc2132D05D31c914a87C6611C10748AEb04B58e8F'),
		),
		{ symbol: 'USDT0', name: 'USDT0', decimals: 6 },
	],

	// Arbitrum
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.arbitrum.id.toString()),
			getAddress('0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'),
		),
		{ symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.arbitrum.id.toString()),
			getAddress('0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'),
		),
		{ symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.arbitrum.id.toString()),
			getAddress('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
		),
		{ symbol: 'USDC', name: 'USD Coin', decimals: 6 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.arbitrum.id.toString()),
			getAddress('0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'),
		),
		{ symbol: 'USD₮0', name: 'USD₮0', decimals: 6 },
	],

	// Avalanche
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.avalanche.id.toString()),
			getAddress('0x50b7545627a5162F82A992c33b87aDc75187B218'),
		),
		{ symbol: 'WBTC.e', name: 'Wrapped BTC', decimals: 8 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.avalanche.id.toString()),
			getAddress('0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'),
		),
		{ symbol: 'WAVAX', name: 'Wrapped AVAX', decimals: 18 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.avalanche.id.toString()),
			getAddress('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'),
		),
		{ symbol: 'USDC', name: 'USD Coin', decimals: 6 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.avalanche.id.toString()),
			getAddress('0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7'),
		),
		{ symbol: 'USDt', name: 'TetherToken', decimals: 6 },
	],

	// Optimism
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.optimism.id.toString()),
			getAddress('0x68f180fcCe6836688e9084f035309E29Bf0A2095'),
		),
		{ symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.optimism.id.toString()),
			getAddress('0x4200000000000000000000000000000000000006'),
		),
		{ symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.optimism.id.toString()),
			getAddress('0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'),
		),
		{ symbol: 'USDC', name: 'USD Coin', decimals: 6 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.optimism.id.toString()),
			getAddress('0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'),
		),
		{ symbol: 'USDT', name: 'Tether USD', decimals: 6 },
	],

	// Base
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.base.id.toString()),
			getAddress('0x0555E30da8f98308EdB960aa94C0Db47230d2B9c'),
		),
		{ symbol: 'WBTC', name: 'Wrapped BTC', decimals: 8 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.base.id.toString()),
			getAddress('0x4200000000000000000000000000000000000006'),
		),
		{ symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
	],
	[
		composeCurrencyId(
			composeChainId(EIP155, chains.base.id.toString()),
			getAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
		),
		{ symbol: 'USDC', name: 'USD Coin', decimals: 6 },
	],
])
