import { Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { EIP155 } from '../../../src/constants'
import { Currency } from '../../../src/domain/entities/currency'
import { composeChainId } from '../../../src/domain/services/chain-id-utils'
import {
	composeCurrencyId,
	parseCurrencyId,
} from '../../../src/domain/services/currency-id-utils'
import { ChainAddress } from '../../../src/domain/value-objects/chain-address'
import { toChainNamespace } from '../../../src/domain/value-objects/chain-namespace'
import { CurrencyId } from '../../../src/domain/value-objects/currency-id'
import {
	CURRENCY_PRICE_SEED_SOURCE,
	CurrencyPriceSeedSource,
} from '../../../src/infrastructure/currency-registry/currency-registry.interfaces'
import { EvmCurrencyService } from '../../../src/infrastructure/evm/evm-currency.service'
import { GeckoTerminalService } from '../../../src/infrastructure/price-provider/gecko-terminal.service'
import { PriceProviderService } from '../../../src/infrastructure/price-provider/price-provider.service'

function ChainAddressFromCurrencyId(id: CurrencyId): ChainAddress {
	const { chainId, address } = parseCurrencyId(id)
	const [namespace, reference] = chainId.split(':')
	return {
		chain: { namespace: toChainNamespace(namespace), reference },
		address,
	}
}

const WETH_ARB_ID = composeCurrencyId(
	composeChainId(EIP155, '42161'),
	'0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
)
const WETH_ARB: Currency = {
	id: WETH_ARB_ID,
	chainAddress: ChainAddressFromCurrencyId(WETH_ARB_ID),
	symbol: 'WETH',
	name: 'Wrapped Ether',
	decimals: 18,
}

const ETH_NATIVE_ARB_ID = composeCurrencyId(
	composeChainId(EIP155, '42161'),
	'0x0000000000000000000000000000000000000000',
)
const ETH_NATIVE_ARB: Currency = {
	id: ETH_NATIVE_ARB_ID,
	chainAddress: ChainAddressFromCurrencyId(ETH_NATIVE_ARB_ID),
	symbol: 'ETH',
	name: 'Ether',
	decimals: 18,
}

function makeMockEvmCurrencyService(): jest.Mocked<
	Pick<EvmCurrencyService, 'getWrappedNative'>
> {
	return {
		getWrappedNative: jest.fn().mockImplementation((chainId: number) => {
			if (chainId === 42161) return Promise.resolve(WETH_ARB)
			throw new Error(`No wrapped native for chain ${chainId}`)
		}),
	}
}

function makeMockPriceSeedSource(): CurrencyPriceSeedSource {
	return {
		seedPrices: () => new Map<CurrencyId, number>(),
	}
}

describe('PriceProviderService', () => {
	let service: PriceProviderService

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PriceProviderService,
				GeckoTerminalService,
				Logger,
				{
					provide: EvmCurrencyService,
					useValue: makeMockEvmCurrencyService(),
				},
				{
					provide: CURRENCY_PRICE_SEED_SOURCE,
					useValue: makeMockPriceSeedSource(),
				},
			],
		}).compile()

		service = module.get(PriceProviderService)
	})

	it('should return same price for native and its wrapped native', async () => {
		const prices = await service.getPrices([ETH_NATIVE_ARB, WETH_ARB])

		expect(prices.get(ETH_NATIVE_ARB.id)).toBe(prices.get(WETH_ARB.id))
	})
})
