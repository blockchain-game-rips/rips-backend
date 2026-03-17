import { Currency } from 'src/domain/entities/currency'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { CurrencyService } from 'src/infrastructure/evm/currency.service'
import { GeckoTerminalService } from 'src/infrastructure/price-provider/gecko-terminal.service'
import { PriceProviderService } from 'src/infrastructure/price-provider/price-provider.service'

const WETH_ARB: Currency = {
	id: composeCurrencyId(
		'eip155:42161',
		'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
	),
	symbol: 'WETH',
	name: 'Wrapped Ether',
	decimals: 18,
}

const WBTC_ARB: Currency = {
	id: composeCurrencyId(
		'eip155:42161',
		'0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
	),
	symbol: 'WBTC',
	name: 'Wrapped Bitcoin',
	decimals: 8,
}

const WETH_FUSE: Currency = {
	id: composeCurrencyId(
		'eip155:122',
		'0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590',
	),
	symbol: 'WETH',
	name: 'Wrapped Ether',
	decimals: 18,
}

const ETH_NATIVE_ARB: Currency = {
	id: composeCurrencyId(
		'eip155:42161',
		'0x0000000000000000000000000000000000000000',
	),
	symbol: 'ETH',
	name: 'Ether',
	decimals: 18,
}

function makeMockGeckoTerminalService(
	prices: { address: string; price: number }[],
): jest.Mocked<Pick<GeckoTerminalService, 'getTokenPrices'>> {
	return {
		getTokenPrices: jest.fn().mockResolvedValue(prices),
	}
}

function makeMockCurrencyService(): jest.Mocked<
	Pick<CurrencyService, 'getWrappedNative'>
> {
	return {
		getWrappedNative: jest.fn().mockImplementation((chainId: number) => {
			if (chainId === 42161) return Promise.resolve(WETH_ARB)
			if (chainId === 122) return Promise.resolve(WETH_FUSE)
			throw new Error(`No wrapped native for chain ${chainId}`)
		}),
	}
}

function makeService(
	geckoMock: jest.Mocked<Pick<GeckoTerminalService, 'getTokenPrices'>>,
	currencyMock: jest.Mocked<Pick<CurrencyService, 'getWrappedNative'>>,
): PriceProviderService {
	return new PriceProviderService(
		currencyMock as unknown as CurrencyService,
		geckoMock as unknown as GeckoTerminalService,
	)
}

describe('PriceProviderService', () => {
	beforeAll(() => {
		jest.useFakeTimers()
	})

	afterAll(() => {
		jest.useRealTimers()
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	it('should return price for a token', async () => {
		const gecko = makeMockGeckoTerminalService([
			{
				address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
				price: 2500,
			},
		])
		const service = makeService(gecko, makeMockCurrencyService())

		const price = await service.getPrice(WETH_ARB)

		expect(price).toBe(2500)
	})

	it('should return prices for multiple tokens', async () => {
		const gecko = makeMockGeckoTerminalService([
			{
				address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
				price: 2500,
			},
			{
				address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
				price: 90000,
			},
		])
		const service = makeService(gecko, makeMockCurrencyService())

		const prices = await service.getPrices([WETH_ARB, WBTC_ARB])

		expect(prices.get(WETH_ARB.id)).toBe(2500)
		expect(prices.get(WBTC_ARB.id)).toBe(90000)
	})

	it('should use cached price on second call for same token', async () => {
		const gecko = makeMockGeckoTerminalService([
			{
				address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
				price: 2500,
			},
		])
		const service = makeService(gecko, makeMockCurrencyService())

		await service.getPrice(WETH_ARB)
		await service.getPrice(WETH_ARB)

		expect(gecko.getTokenPrices).toHaveBeenCalledTimes(1)
	})

	it('should refetch when any token is missing from cache', async () => {
		const gecko = makeMockGeckoTerminalService([
			{
				address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
				price: 2500,
			},
			{
				address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
				price: 90000,
			},
		])
		const service = makeService(gecko, makeMockCurrencyService())

		await service.getPrices([WETH_ARB])
		await service.getPrices([WETH_ARB, WBTC_ARB])

		expect(gecko.getTokenPrices).toHaveBeenCalledTimes(2)
	})

	it('should resolve native currency to its wrapped token before fetching', async () => {
		const gecko = makeMockGeckoTerminalService([
			{
				address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
				price: 2500,
			},
		])
		const currencyService = makeMockCurrencyService()
		const service = makeService(gecko, currencyService)

		await service.getPrice(ETH_NATIVE_ARB)

		expect(currencyService.getWrappedNative).toHaveBeenCalledWith(42161)
		expect(gecko.getTokenPrices).toHaveBeenCalledWith(
			['0x82af49447d8a07e3bd95bd0d56f35241523fbab1'],
			'arbitrum',
		)
	})

	it('should return same price for native and its wrapped native', async () => {
		const gecko = makeMockGeckoTerminalService([
			{
				address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
				price: 2500,
			},
		])
		const service = makeService(gecko, makeMockCurrencyService())

		const prices = await service.getPrices([ETH_NATIVE_ARB, WETH_ARB])

		expect(prices.get(ETH_NATIVE_ARB.id)).toBe(prices.get(WETH_ARB.id))
	})

	it('should throw when chainId is not supported', async () => {
		const unsupportedCurrency: Currency = {
			id: composeCurrencyId(
				'eip155:99999',
				'0x1234567890123456789012345678901234567890',
			),
			symbol: 'TEST',
			decimals: 18,
		}
		const service = makeService(
			makeMockGeckoTerminalService([]),
			makeMockCurrencyService(),
		)

		await expect(service.getPrice(unsupportedCurrency)).rejects.toThrow(
			'Unsupported chainId for PriceProvider: 99999',
		)
	})
})
