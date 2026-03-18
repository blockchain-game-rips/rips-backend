import { CurrencyService } from 'src/application/interfaces/currency.service'
import { GetBalanceService } from 'src/application/use-cases/get-balance/get-balance.service'
import {
	GetUserUseCase,
	UserNotFoundError,
} from 'src/application/use-cases/get-user/get-user.use-case'
import { Currency } from 'src/domain/entities/currency'
import { User } from 'src/domain/entities/user'
import { composeChainId } from 'src/domain/services/chain-id-utils'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { toChainNamespace } from 'src/domain/value-objects/chain-namespace'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { toTelegramId } from 'src/domain/value-objects/telegram-id'
import { MAIN_CURRENCY_VALUE } from 'src/modules/wallets/wallets.constants'

const EIP155 = toChainNamespace('eip155')
const TELEGRAM_ID = toTelegramId(123456n)
const EVM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

const MOCK_USER: User = {
	id: 1n,
	telegramId: TELEGRAM_ID,
	evmWallet: { address: EVM_ADDRESS, kmsKeyId: 'kms-key-123' },
	createdAt: new Date('2026-01-01'),
}

const MOCK_CURRENCY: Currency = {
	id: composeCurrencyId(composeChainId(EIP155, '8453'), '0x0000000000000000000000000000000000000000'),
	account: { chain: { namespace: EIP155, reference: '8453' }, address: '0x0000000000000000000000000000000000000000' },
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
	balanceOf: jest.fn(),
}

function makeMockGetUserUseCase(): jest.Mocked<GetUserUseCase> {
	return { execute: jest.fn() }
}

function makeMockCurrencyService(): jest.Mocked<CurrencyService> {
	return { fromAccount: jest.fn() }
}

describe('GetBalanceService', () => {
	let getUserUseCase: jest.Mocked<GetUserUseCase>
	let currencyService: jest.Mocked<CurrencyService>
	let service: GetBalanceService

	beforeEach(() => {
		getUserUseCase = makeMockGetUserUseCase()
		currencyService = makeMockCurrencyService()
		service = new GetBalanceService(getUserUseCase, currencyService, MAIN_CURRENCY_VALUE)
	})

	it('should return currency amount for user wallet', async () => {
		const balance = 1000000000000000000n
		const mockCurrency = { ...MOCK_CURRENCY, balanceOf: jest.fn().mockResolvedValue(balance) }

		getUserUseCase.execute.mockResolvedValue(MOCK_USER)
		currencyService.fromAccount.mockResolvedValue(mockCurrency)

		const result: CurrencyAmount = await service.execute({ telegramId: TELEGRAM_ID })

		expect(result).toEqual({ currency: mockCurrency, amount: balance })
		expect(mockCurrency.balanceOf).toHaveBeenCalledWith(EVM_ADDRESS)
	})

	it('should propagate UserNotFoundError', async () => {
		getUserUseCase.execute.mockRejectedValue(new UserNotFoundError('not found'))

		await expect(
			service.execute({ telegramId: TELEGRAM_ID }),
		).rejects.toThrow(UserNotFoundError)
	})
})
