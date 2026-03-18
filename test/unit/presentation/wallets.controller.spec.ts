import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { UserNotFoundError } from 'src/application/use-cases/get-user/get-user.use-case'
import { composeChainId } from 'src/domain/services/chain-id-utils'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { toChainNamespace } from 'src/domain/value-objects/chain-namespace'
import { CurrencyAmount } from 'src/domain/value-objects/currency-amount'
import { toTelegramId } from 'src/domain/value-objects/telegram-id'
import { WalletsController } from 'src/presentation/wallets/wallets.controller'

const TELEGRAM_ID = toTelegramId(123456n)
const EIP155 = toChainNamespace('eip155')
const NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000'

const MOCK_BALANCE: CurrencyAmount = {
	amount: 1000000000000000000n,
	currency: {
		id: composeCurrencyId(composeChainId(EIP155, '8453'), NATIVE_ADDRESS),
		account: { chain: { namespace: EIP155, reference: '8453' }, address: NATIVE_ADDRESS },
		symbol: 'ETH',
		name: 'ETH',
		decimals: 18,
	},
}

function makeMockGetBalanceUseCase(): jest.Mocked<GetBalanceUseCase> {
	return { execute: jest.fn() }
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
			expect(getBalance.execute).toHaveBeenCalledWith({ telegramId: TELEGRAM_ID })
		})

		it('should propagate UserNotFoundError', async () => {
			getBalance.execute.mockRejectedValue(new UserNotFoundError('not found'))

			await expect(controller.getBalance(TELEGRAM_ID)).rejects.toThrow(UserNotFoundError)
		})
	})
})
