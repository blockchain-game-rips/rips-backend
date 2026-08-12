import { Address, getAddress } from 'viem'
import * as chains from 'viem/chains'

export const NATIVE_ADDRESS: Address =
	'0x0000000000000000000000000000000000000000'

export const LIFI_NATIVE_ADDRESS: Address =
	'0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

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
