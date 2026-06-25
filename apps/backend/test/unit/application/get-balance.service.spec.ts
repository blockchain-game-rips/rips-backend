import { CurrencyService } from '../../../src/application/interfaces/currency.service'
import { GetBalanceService } from '../../../src/application/use-cases/get-balance/get-balance.service'
import { UserNotFoundError } from '../../../src/application/use-cases/get-user/get-user.use-case'
import { CurrencyAmount } from '../../../src/domain/value-objects/currency-amount'
import {
	MOCK_CURRENCY,
	MOCK_USER,
	MOCK_WALLET,
	NATIVE_CURRENCY_CHAIN_ADDRESS,
	TELEGRAM_ID,
} from '../../fixtures/entities'
import {
	makeMockGetUserUseCase,
	makeMockWalletService,
} from '../../mocks/use-cases'

describe('GetBalanceService', () => {
	const getUserUseCase = makeMockGetUserUseCase()
	const walletService = makeMockWalletService()
	const currencyService: jest.Mocked<CurrencyService> = {
		fromAccount: jest.fn(),
	}
	const cacheManager = {
		get: jest.fn().mockResolvedValue(undefined),
		set: jest.fn(),
	} as never
	const service = new GetBalanceService(
		getUserUseCase,
		walletService,
		currencyService,
		cacheManager,
	)

	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('should return currency amount for user wallet', async () => {
		const balance = 1000000000000000000n

		getUserUseCase.execute.mockResolvedValue(MOCK_USER)
		walletService.balanceOf.mockResolvedValue(balance)
		currencyService.fromAccount.mockResolvedValue(MOCK_CURRENCY)

		const result: CurrencyAmount = await service.execute({
			telegramId: TELEGRAM_ID,
			currencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
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
			service.execute({
				telegramId: TELEGRAM_ID,
				currencyChainAddress: NATIVE_CURRENCY_CHAIN_ADDRESS,
			}),
		).rejects.toThrow(UserNotFoundError)
	})
})
