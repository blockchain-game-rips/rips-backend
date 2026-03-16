import { Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { Currency } from 'src/domain/entities/currency'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { CurrencyService } from 'src/infrastructure/evm/currency.service'
import { GeckoTerminalService } from 'src/infrastructure/price-provider/gecko-terminal.service'
import { PriceProviderService } from 'src/infrastructure/price-provider/price-provider.service'
import { wait } from 'src/utils/common'

const WETH_ARB: Currency = {
	id: composeCurrencyId('eip155:42161', '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'),
	symbol: 'WETH',
	name: 'Wrapped Ether',
	decimals: 18,
}

const ETH_NATIVE_ARB: Currency = {
	id: composeCurrencyId('eip155:42161', '0x0000000000000000000000000000000000000000'),
	symbol: 'ETH',
	name: 'Ether',
	decimals: 18,
}

function makeMockCurrencyService(): jest.Mocked<Pick<CurrencyService, 'getWrappedNative'>> {
	return {
		getWrappedNative: jest.fn().mockImplementation((chainId: number) => {
			if (chainId === 42161) return Promise.resolve(WETH_ARB)
			throw new Error(`No wrapped native for chain ${chainId}`)
		}),
	}
}

describe('PriceProviderService', () => {
	let service: PriceProviderService

	beforeEach(async () => {
		await wait(10_000)
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PriceProviderService,
				GeckoTerminalService,
				Logger,
				{ provide: CurrencyService, useValue: makeMockCurrencyService() },
			],
		}).compile()

		service = module.get(PriceProviderService)
	})

	it('should return a positive price for a regular token', async () => {
		const price = await service.getPrice(WETH_ARB)

		expect(price).toBeGreaterThan(0)
	})

	it('should return a positive price for a native currency', async () => {
		const price = await service.getPrice(ETH_NATIVE_ARB)

		expect(price).toBeGreaterThan(0)
	})

	it('should return same price for native and its wrapped native', async () => {
		const prices = await service.getPrices([ETH_NATIVE_ARB, WETH_ARB])

		expect(prices.get(ETH_NATIVE_ARB.id)).toBe(prices.get(WETH_ARB.id))
	})
})
