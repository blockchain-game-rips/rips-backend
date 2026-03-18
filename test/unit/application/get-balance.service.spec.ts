import { GetBalanceService } from 'src/application/use-cases/get-balance/get-balance.service'
import { GetUserUseCase, UserNotFoundError } from 'src/application/use-cases/get-user/get-user.use-case'
import { User } from 'src/domain/entities/user'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { toTelegramId } from 'src/domain/value-objects/telegram-id'
import { CurrencyService } from 'src/infrastructure/evm/currency.service'
import { NativeCurrency } from 'src/infrastructure/evm/primitives/currencies/native-currency'

const TELEGRAM_ID = toTelegramId(123456n)
const CHAIN_ID = 8453

const MOCK_USER: User = {
	id: 1n,
	telegramId: TELEGRAM_ID,
	evmAddress: '0x1234567890abcdef1234567890abcdef12345678',
	createdAt: new Date('2026-01-01'),
}

const MOCK_NATIVE = {
	id: 'eip155:8453:0x0000000000000000000000000000000000000000',
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
	balanceOf: jest.fn(),
} as unknown as jest.Mocked<NativeCurrency>

function makeMockGetUserUseCase(): jest.Mocked<GetUserUseCase> {
	return { execute: jest.fn() }
}

function makeMockCurrencyService(): jest.Mocked<CurrencyService> {
	return { getNative: jest.fn() } as unknown as jest.Mocked<CurrencyService>
}

describe('GetBalanceService', () => {
	let getUserUseCase: jest.Mocked<GetUserUseCase>
	let currencyService: jest.Mocked<CurrencyService>
	let service: GetBalanceService

	beforeEach(() => {
		getUserUseCase = makeMockGetUserUseCase()
		currencyService = makeMockCurrencyService()
		service = new GetBalanceService(getUserUseCase, currencyService, CHAIN_ID)
	})

	it('should return currency amount for user wallet', async () => {
		const balance = 1000000000000000000n

		getUserUseCase.execute.mockResolvedValue(MOCK_USER)
		currencyService.getNative.mockReturnValue(MOCK_NATIVE)
		MOCK_NATIVE.balanceOf.mockResolvedValue(balance)

		const result: CurrencyAmount = await service.execute({ telegramId: TELEGRAM_ID })

		expect(result).toEqual({ token: MOCK_NATIVE, amount: balance })
		expect(currencyService.getNative).toHaveBeenCalledWith(CHAIN_ID)
		expect(MOCK_NATIVE.balanceOf).toHaveBeenCalledWith(MOCK_USER.evmAddress)
	})

	it('should propagate UserNotFoundError', async () => {
		getUserUseCase.execute.mockRejectedValue(new UserNotFoundError('not found'))

		await expect(
			service.execute({ telegramId: TELEGRAM_ID }),
		).rejects.toThrow(UserNotFoundError)
	})
})
