import { CurrencyService } from '../../../src/application/interfaces/currency.service'
import { SupportedCurrencies } from '../../../src/infrastructure/currency-registry/currency-registry.interfaces'
import { CurrencyController } from '../../../src/presentation/currency/currency.controller'
import { PricedCurrency } from '../../../src/presentation/shared/pricing/priced-currency'
import {
	MOCK_CURRENCY,
	NATIVE_CURRENCY_CHAIN_ADDRESS,
} from '../../fixtures/entities'

describe('CurrencyController', () => {
	const fromAccount = vi.fn()
	const supported = vi.fn()

	const currencyService: CurrencyService = { fromAccount }
	const supportedCurrencies: SupportedCurrencies = { supported }

	const controller = new CurrencyController(
		currencyService,
		supportedCurrencies,
	)

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('GET /currencies/supported', () => {
		it('resolves each supported chain address into a priced currency', async () => {
			supported.mockReturnValue([NATIVE_CURRENCY_CHAIN_ADDRESS])
			fromAccount.mockResolvedValue(MOCK_CURRENCY)

			const result = await controller.getSupportedCurrencies()

			expect(fromAccount).toHaveBeenCalledWith(
				NATIVE_CURRENCY_CHAIN_ADDRESS,
			)
			expect(result.currencies).toHaveLength(1)
			expect(result.currencies[0]).toBeInstanceOf(PricedCurrency)
			expect(result.currencies[0].id).toBe(MOCK_CURRENCY.id)
		})

		it('returns an empty list when nothing is supported', async () => {
			supported.mockReturnValue([])

			const result = await controller.getSupportedCurrencies()

			expect(result.currencies).toEqual([])
			expect(fromAccount).not.toHaveBeenCalled()
		})

		it('propagates a resolution failure', async () => {
			supported.mockReturnValue([NATIVE_CURRENCY_CHAIN_ADDRESS])
			fromAccount.mockRejectedValue(new Error('unresolved'))

			await expect(controller.getSupportedCurrencies()).rejects.toThrow(
				'unresolved',
			)
		})
	})
})
