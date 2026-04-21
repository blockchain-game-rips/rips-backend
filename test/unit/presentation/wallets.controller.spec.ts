import { UserNotFoundError } from '../../../src/application/use-cases/get-user/get-user.use-case'
import { EIP155 } from '../../../src/constants'
import { CurrencyAmount } from '../../../src/domain/value-objects/currency-amount'
import { WalletsController } from '../../../src/presentation/wallets/wallets.controller'
import {
	MOCK_CURRENCY,
	MOCK_CURRENCY_CHAIN_ADDRESS,
	NATIVE_ADDRESS,
	TELEGRAM_ID,
} from '../../fixtures/entities'
import {
	makeMockGetBalanceUseCase,
	makeMockWithdrawUseCase,
} from '../../mocks/use-cases'

const MOCK_BALANCE: CurrencyAmount = {
	amount: 1000000000000000000n,
	currency: MOCK_CURRENCY,
}

describe('WalletsController', () => {
	const getBalance = makeMockGetBalanceUseCase()
	const controller = new WalletsController(
		getBalance,
		makeMockWithdrawUseCase(),
	)

	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('POST /users/:telegramId/wallet/balance', () => {
		it('should return balance response dto', async () => {
			getBalance.execute.mockResolvedValue(MOCK_BALANCE)

			const result = await controller.getBalance(
				{ telegramId: TELEGRAM_ID },
				{
					currencyChainAddress: MOCK_CURRENCY_CHAIN_ADDRESS,
				},
			)

			expect(result).toEqual({
				currency: {
					chainAddress: {
						chain: { namespace: EIP155, reference: '8453' },
						address: NATIVE_ADDRESS,
					},
					symbol: 'ETH',
					name: 'ETH',
					decimals: 18,
				},
				amount: '1000000000000000000',
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
				controller.getBalance(
					{ telegramId: TELEGRAM_ID },
					{
						currencyChainAddress: MOCK_CURRENCY_CHAIN_ADDRESS,
					},
				),
			).rejects.toThrow(UserNotFoundError)
		})
	})
})
