import { GetBalanceService } from '../../../src/application/use-cases/get-balance/get-balance.service'
import { UserNotFoundError } from '../../../src/application/use-cases/get-user/get-user.use-case'
import { CurrencyAmount } from '../../../src/domain/value-objects/currency-amount'
import {
	MOCK_CURRENCY,
	MOCK_USER,
	MOCK_WALLET,
	TELEGRAM_ID,
} from '../../fixtures/entities'
import {
	makeMockGetUserUseCase,
	makeMockWalletService,
} from '../../mocks/use-cases'

describe('GetBalanceService', () => {
	const getUserUseCase = makeMockGetUserUseCase()
	const walletService = makeMockWalletService()
	const service = new GetBalanceService(
		getUserUseCase,
		walletService,
		MOCK_CURRENCY,
	)

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return currency amount for user wallet', async () => {
		const balance = 1000000000000000000n

		getUserUseCase.execute.mockResolvedValue(MOCK_USER)
		walletService.balanceOf.mockResolvedValue(balance)

		const result: CurrencyAmount = await service.execute({
			telegramId: TELEGRAM_ID,
		})

		expect(result).toEqual({ currency: MOCK_CURRENCY, amount: balance })
		expect(walletService.balanceOf).toHaveBeenCalledWith(
			MOCK_WALLET,
			MOCK_CURRENCY,
		)
	})

	it('should propagate UserNotFoundError', async () => {
		getUserUseCase.execute.mockRejectedValue(
			new UserNotFoundError('not found'),
		)

		await expect(
			service.execute({ telegramId: TELEGRAM_ID }),
		).rejects.toThrow(UserNotFoundError)
	})
})
