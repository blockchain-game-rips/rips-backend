import { WalletService } from 'src/application/interfaces/wallet.service'
import { GetBalanceService } from 'src/application/use-cases/get-balance/get-balance.service'
import {
	GetUserUseCase,
	UserNotFoundError,
} from 'src/application/use-cases/get-user/get-user.use-case'
import { EIP155 } from 'src/constants'
import { Currency } from 'src/domain/entities/currency'
import { User } from 'src/domain/entities/user'
import { composeChainId } from 'src/domain/services/chain-id-utils'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { toTelegramId } from 'src/domain/value-objects/telegram-id'
import { Wallet } from 'src/domain/value-objects/wallet'

const TELEGRAM_ID = toTelegramId(123456n)
const EVM_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

const MOCK_WALLET: Wallet = {
	kind: 'user',
	namespaceToAddress: { [EIP155]: EVM_ADDRESS },
}

const MOCK_USER: User = {
	id: 1n,
	telegramProfile: { telegramId: TELEGRAM_ID },
	wallet: MOCK_WALLET,
	createdAt: new Date('2026-01-01'),
}

const MOCK_CURRENCY: Currency = {
	id: composeCurrencyId(
		composeChainId(EIP155, '8453'),
		'0x0000000000000000000000000000000000000000',
	),
	chainAddress: {
		chain: { namespace: EIP155, reference: '8453' },
		address: '0x0000000000000000000000000000000000000000',
	},
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
}

function makeMockGetUserUseCase(): jest.Mocked<GetUserUseCase> {
	return { execute: jest.fn() }
}

function makeMockWalletService(): jest.Mocked<WalletService> {
	return { balanceOf: jest.fn(), transfer: jest.fn() }
}

describe('GetBalanceService', () => {
	let getUserUseCase: jest.Mocked<GetUserUseCase>
	let walletService: jest.Mocked<WalletService>
	let service: GetBalanceService

	beforeEach(() => {
		getUserUseCase = makeMockGetUserUseCase()
		walletService = makeMockWalletService()
		service = new GetBalanceService(
			getUserUseCase,
			walletService,
			MOCK_CURRENCY,
		)
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
