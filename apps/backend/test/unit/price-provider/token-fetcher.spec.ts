import { getAddress } from 'viem'
import { NATIVE_ADDRESS } from '../../../src/infrastructure/evm/primitives/currencies/constants'
import {
	geckoNetworkOf,
	priceableAddress,
} from '../../../src/infrastructure/price-provider/token-fetcher'

const MAINNET_CHAIN_ID = 1
const UNSUPPORTED_CHAIN_ID = 999999
const USDC_LOWERCASE = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const WETH_MAINNET = getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

describe('geckoNetworkOf', () => {
	it('maps a known chain id to its gecko network', () => {
		expect(geckoNetworkOf(MAINNET_CHAIN_ID)).toBe('eth')
	})

	it('throws for an unsupported chain id', () => {
		expect(() => geckoNetworkOf(UNSUPPORTED_CHAIN_ID)).toThrow(
			/Unsupported chainId/,
		)
	})
})

describe('priceableAddress', () => {
	it('checksums a token address unchanged', () => {
		expect(priceableAddress(MAINNET_CHAIN_ID, USDC_LOWERCASE)).toBe(
			getAddress(USDC_LOWERCASE),
		)
	})

	it('resolves native to the wrapped native address', () => {
		expect(priceableAddress(MAINNET_CHAIN_ID, NATIVE_ADDRESS)).toBe(
			WETH_MAINNET,
		)
	})

	it('throws when a chain has no wrapped native', () => {
		expect(() =>
			priceableAddress(UNSUPPORTED_CHAIN_ID, NATIVE_ADDRESS),
		).toThrow(/No wrapped native/)
	})
})
