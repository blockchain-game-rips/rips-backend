import { getAddress } from 'viem'
import { EIP155 } from '../../../../src/constants'
import { composeChainId } from '../../../../src/domain/services/chain-id-utils'
import { composeCurrencyId } from '../../../../src/domain/services/currency-id-utils'
import { ChainAddress } from '../../../../src/domain/value-objects/chain-address'
import { toChainNamespace } from '../../../../src/domain/value-objects/chain-namespace'
import { CurrencyRegistry } from '../../../../src/infrastructure/currency-registry/currency-registry'
import { EnrichedCurrency } from '../../../../src/infrastructure/currency-registry/enriched-currency'

const USDC_ADDRESS = getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const WETH_ADDRESS = getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

const MAINNET_REFERENCE = '1'

function chainAddress(address: string): ChainAddress {
	return {
		chain: {
			namespace: toChainNamespace(EIP155),
			reference: MAINNET_REFERENCE,
		},
		address,
	}
}

function usdcRow(): EnrichedCurrency {
	return {
		chain: {
			namespace: toChainNamespace(EIP155),
			reference: MAINNET_REFERENCE,
		},
		address: USDC_ADDRESS,
		metadata: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
		lastKnownPrice: 1.0,
	}
}

function wethRow(): EnrichedCurrency {
	return {
		chain: {
			namespace: toChainNamespace(EIP155),
			reference: MAINNET_REFERENCE,
		},
		address: WETH_ADDRESS,
		metadata: { symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
		lastKnownPrice: 1900,
	}
}

function idOf(address: string) {
	return composeCurrencyId(
		composeChainId(toChainNamespace(EIP155), MAINNET_REFERENCE),
		address,
	)
}

describe('CurrencyRegistry', () => {
	describe('metadataOf', () => {
		it('returns metadata for a known currency', () => {
			const registry = new CurrencyRegistry([usdcRow()], [])

			expect(registry.metadataOf(idOf(USDC_ADDRESS))).toEqual({
				symbol: 'USDC',
				name: 'USD Coin',
				decimals: 6,
			})
		})

		it('returns undefined for an unknown currency (caller falls back)', () => {
			const registry = new CurrencyRegistry([usdcRow()], [])

			expect(registry.metadataOf(idOf(WETH_ADDRESS))).toBeUndefined()
		})

		it('normalizes stored address casing to checksum', () => {
			const lowercaseRow: EnrichedCurrency = {
				...usdcRow(),
				address: USDC_ADDRESS.toLowerCase(),
			}
			const registry = new CurrencyRegistry([lowercaseRow], [])

			expect(registry.metadataOf(idOf(USDC_ADDRESS))).toBeDefined()
		})
	})

	describe('seedPrices', () => {
		it('maps every row to its last known price', () => {
			const registry = new CurrencyRegistry([usdcRow(), wethRow()], [])
			const prices = registry.seedPrices()

			expect(prices.get(idOf(USDC_ADDRESS))).toBe(1.0)
			expect(prices.get(idOf(WETH_ADDRESS))).toBe(1900)
		})
	})

	describe('supported', () => {
		it('returns only allowlisted rows', () => {
			const registry = new CurrencyRegistry(
				[usdcRow(), wethRow()],
				[chainAddress(USDC_ADDRESS)],
			)

			const supported = registry.supported()

			expect(supported).toHaveLength(1)
			expect(supported[0].address).toBe(USDC_ADDRESS)
		})

		it('resolves allowlist entries regardless of casing', () => {
			const registry = new CurrencyRegistry(
				[usdcRow()],
				[chainAddress(USDC_ADDRESS.toLowerCase())],
			)

			expect(registry.supported()).toHaveLength(1)
		})

		it('fails fast when an allowlist entry is not in the registry', () => {
			expect(
				() =>
					new CurrencyRegistry(
						[usdcRow()],
						[chainAddress(WETH_ADDRESS)],
					),
			).toThrow(/not in the enriched registry/)
		})
	})
})
