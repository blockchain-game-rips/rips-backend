import { lastValueFrom, of } from 'rxjs'
import { PriceProvider } from '../../../src/application/interfaces/price-service'
import { Currency } from '../../../src/domain/entities/currency'
import { toChainNamespace } from '../../../src/domain/value-objects/chain-namespace'
import { CurrencyId } from '../../../src/domain/value-objects/currency-id'
import { collectPricedNodes } from '../../../src/presentation/shared/pricing/collect-priced-nodes'
import { PriceEnrichmentInterceptor } from '../../../src/presentation/shared/pricing/price-enrichment.interceptor'
import { PricedCurrency } from '../../../src/presentation/shared/pricing/priced-currency'

function makeCurrencyId(address: string): CurrencyId {
	return `${toChainNamespace('eip155')}:1:${address}`
}

function makeCurrency(id: CurrencyId): Currency {
	return {
		id,
		chainAddress: {
			chain: { namespace: toChainNamespace('eip155'), reference: '1' },
			address: '0xabc',
		},
		symbol: 'TKN',
		name: 'Token',
		decimals: 18,
	}
}

const TOKEN_A = makeCurrency(makeCurrencyId('0xaaa'))
const TOKEN_B = makeCurrency(makeCurrencyId('0xbbb'))

describe('collectPricedNodes', () => {
	it('finds PricedCurrency nodes at any depth', () => {
		const node = new PricedCurrency(TOKEN_A)

		const tree = { a: { b: [{ c: node }] }, d: 'x', e: null }

		expect(collectPricedNodes(tree)).toEqual([node])
	})

	it('returns empty for trees without priced nodes', () => {
		expect(collectPricedNodes({ a: [1, 'b', null] })).toEqual([])
	})
})

describe('PriceEnrichmentInterceptor', () => {
	function makeInterceptor(prices: Map<CurrencyId, number>) {
		const provider: PriceProvider = {
			getPrice: vi.fn(),
			getPrices: vi.fn().mockResolvedValue(prices),
		}

		return {
			interceptor: new PriceEnrichmentInterceptor(provider),
			provider,
		}
	}

	function run(interceptor: PriceEnrichmentInterceptor, response: unknown) {
		const ctx = {} as never
		const handler = { handle: () => of(response) }

		return lastValueFrom(interceptor.intercept(ctx, handler))
	}

	it('fills priceUsd from a single deduped batch fetch', async () => {
		const nodeA1 = new PricedCurrency(TOKEN_A)
		const nodeA2 = new PricedCurrency(TOKEN_A)
		const nodeB = new PricedCurrency(TOKEN_B)

		const prices = new Map([
			[TOKEN_A.id, 42],
			[TOKEN_B.id, 7],
		])

		const { interceptor, provider } = makeInterceptor(prices)

		const response = { items: [nodeA1, nodeA2], other: nodeB }

		await run(interceptor, response)

		expect(nodeA1.priceUsd).toBe(42)
		expect(nodeA2.priceUsd).toBe(42)
		expect(nodeB.priceUsd).toBe(7)

		const fetched = vi.mocked(provider.getPrices).mock.calls[0][0]

		expect(provider.getPrices).toHaveBeenCalledTimes(1)
		expect(fetched).toHaveLength(2)
	})

	it('falls back to 0 when a price is missing', async () => {
		const node = new PricedCurrency(TOKEN_A)

		const { interceptor } = makeInterceptor(new Map())

		await run(interceptor, { node })

		expect(node.priceUsd).toBe(0)
	})

	it('skips fetching when no priced nodes are present', async () => {
		const { interceptor, provider } = makeInterceptor(new Map())

		await run(interceptor, { plain: true })

		expect(provider.getPrices).not.toHaveBeenCalled()
	})
})
