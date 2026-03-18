import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { UserNotFoundError } from 'src/application/use-cases/get-user/get-user.use-case'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { toTelegramId } from 'src/domain/value-objects/telegram-id'
import { WalletsController } from 'src/presentation/wallets/wallets.controller'

const TELEGRAM_ID = toTelegramId(123456n)

const MOCK_BALANCE: CurrencyAmount = {
	amount: 1000000000000000000n,
	token: {
		id: 'eip155:8453:0x0000000000000000000000000000000000000000',
		symbol: 'ETH',
		name: 'ETH',
		decimals: 18,
	},
}

function makeMockGetBalanceUseCase(): jest.Mocked<GetBalanceUseCase> {
	const mock: jest.Mocked<GetBalanceUseCase> = { execute: jest.fn() }
	return mock
}

describe('WalletsController', () => {
	let getBalance: jest.Mocked<GetBalanceUseCase>
	let controller: WalletsController

	beforeEach(() => {
		getBalance = makeMockGetBalanceUseCase()
		controller = new WalletsController(getBalance)
	})

	describe('GET /users/:telegramId/wallet/balance', () => {
		it('should return balance response dto', async () => {
			getBalance.execute.mockResolvedValue(MOCK_BALANCE)

			const result = await controller.getBalance(TELEGRAM_ID)

			expect(result).toEqual({
				amount: '1000000000000000000',
				symbol: 'ETH',
				name: 'ETH',
				decimals: 18,
			})
			expect(getBalance.execute).toHaveBeenCalledWith({
				telegramId: TELEGRAM_ID,
			})
		})

		it('should propagate UserNotFoundError', async () => {
			getBalance.execute.mockRejectedValue(
				new UserNotFoundError('not found'),
			)

			await expect(controller.getBalance(TELEGRAM_ID)).rejects.toThrow(
				UserNotFoundError,
			)
		})
	})
})
