import { CurrencyMetadata } from 'src/domain/entities/currency'
import { Address, getAddress } from 'viem'
import * as chains from 'viem/chains'

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
	[chains.arbitrum.id]: ETH_METADATA,
	[chains.swellchain.id]: ETH_METADATA,
	[chains.base.id]: ETH_METADATA,
	[chains.hemi.id]: ETH_METADATA,
	[chains.lightlinkPhoenix.id]: ETH_METADATA,
	[chains.bob.id]: ETH_METADATA,
	[chains.fuse.id]: createMetadata('FUSE', 'FUSE', 18),
	[chains.story.id]: createMetadata('IP', 'IP', 18),
	[chains.bsc.id]: createMetadata('BNB', 'BNB', 18),
	[chains.monad.id]: createMetadata('MON', 'MON', 18),
	[chains.corn.id]: createMetadata('BTCN', 'BTCN', 18),
	[chains.apeChain.id]: createMetadata('APE', 'APE', 18),
} as const

const WRAPPED_TOKENS_RAW: Record<number, Address> = {
	[chains.arbitrum.id]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
	[chains.lightlinkPhoenix.id]: '0x7EbeF2A4b1B09381Ec5B9dF8C5c6f2dBECA59c73',
	[chains.hemi.id]: '0x4200000000000000000000000000000000000006',
	[chains.fuse.id]: '0x0BE9e53fd7EDaC9F859882AfdDa116645287C629',
	[chains.story.id]: '0x1514000000000000000000000000000000000000',
	[chains.bsc.id]: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
	[chains.gravity.id]: '0xBB859E225ac8Fb6BE1C7e38D87b767e95Fef0EbD',
	[chains.base.id]: '0x4200000000000000000000000000000000000006',
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
