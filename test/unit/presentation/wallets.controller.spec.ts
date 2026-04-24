import { UserNotFoundError } from '../../../src/application/use-cases/get-user/get-user.use-case'
import { EIP155 } from '../../../src/constants'
import { CurrencyAmount } from '../../../src/domain/value-objects/currency-amount'
import { TELEGRAM_ID_HEADER } from '../../../src/presentation/shared/telegram-id.header'
import { WalletsController } from '../../../src/presentation/wallets/wallets.controller'
import {
	MOCK_CURRENCY,
	MOCK_CURRENCY_CHAIN_ADDRESS,
	NATIVE_ADDRESS,
	TELEGRAM_ID,
} from '../../fixtures/entities'
import {
	makeMockCurrencyService,
	makeMockGetBalanceUseCase,
	makeMockGetPriceUseCase,
	makeMockQuoteSwapUseCase,
	makeMockSwapUseCase,
	makeMockWithdrawUseCase,
} from '../../mocks/use-cases'

const MOCK_BALANCE: CurrencyAmount = {
	amount: 1000000000000000000n,
	currency: MOCK_CURRENCY,
}

const MOCK_PRICE_USD = 2500

describe('WalletsController', () => {
	const getBalance = makeMockGetBalanceUseCase()
	const getPrice = makeMockGetPriceUseCase()
	const controller = new WalletsController(
		getBalance,
		getPrice,
		makeMockWithdrawUseCase(),
		makeMockQuoteSwapUseCase(),
		makeMockSwapUseCase(),
		makeMockCurrencyService(),
	)

	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('GET /wallets/balances', () => {
		it('should return balances response dto', async () => {
			getBalance.execute.mockResolvedValue(MOCK_BALANCE)
			getPrice.executeMany.mockResolvedValue(
				new Map([[MOCK_CURRENCY.id, MOCK_PRICE_USD]]),
			)

			const result = await controller.getBalances(
				{ [TELEGRAM_ID_HEADER]: TELEGRAM_ID },
				{ chainAddress: [MOCK_CURRENCY_CHAIN_ADDRESS] },
			)

			expect(result).toEqual({
				balances: [
					{
						currency: {
							chainAddress: {
								chain: { namespace: EIP155, reference: '8453' },
								address: NATIVE_ADDRESS,
							},
							symbol: 'ETH',
							name: 'ETH',
							decimals: 18,
							priceUsd: MOCK_PRICE_USD,
						},
						amount: '1000000000000000000',
					},
				],
			})
			expect(getBalance.execute).toHaveBeenCalledWith({
				telegramId: TELEGRAM_ID,
				currencyChainAddress: MOCK_CURRENCY_CHAIN_ADDRESS,
			})
		})

		it('should propagate UserNotFoundError', async () => {
			getBalance.execute.mockRejectedValue(
				new UserNotFoundError('not found'),
			)

			await expect(
				controller.getBalances(
					{ [TELEGRAM_ID_HEADER]: TELEGRAM_ID },
					{ chainAddress: [MOCK_CURRENCY_CHAIN_ADDRESS] },
				),
			).rejects.toThrow(UserNotFoundError)
		})
	})
})
