import { Injectable } from '@nestjs/common'
import { InsufficientBalanceError } from '../../../domain/errors/insufficient-balance.error'
import { WithdrawOutcome } from '../../../domain/value-objects/withdraw-outcome'
import { CurrencyService } from '../../interfaces/currency.service'
import { WalletService } from '../../interfaces/wallet.service'
import { ZapService } from '../../interfaces/zap.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { WithdrawInput, WithdrawUseCase } from './withdraw.use-case'

@Injectable()
export class WithdrawService implements WithdrawUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletService: WalletService,
		private readonly currencyService: CurrencyService,
		private readonly zapService: ZapService,
	) {}

	async execute(input: WithdrawInput): Promise<WithdrawOutcome> {
		const { telegramId, amountIn, currencyOut, recipientAddress } = input

		const user = await this.getUserUseCase.execute({ telegramId })

		const userBalance = await this.walletService.balanceOf(
			user.wallet,
			amountIn.currency,
		)

		if (userBalance < amountIn.amount)
			throw new InsufficientBalanceError(
				`Insufficient balance, need ${amountIn.amount}, has ${userBalance}`,
			)

		if (amountIn.currency.id === currencyOut.id) {
			const recipient = {
				chain: amountIn.currency.chainAddress.chain,
				address: recipientAddress,
			}

			const transaction = await this.walletService.transfer(user.wallet, {
				currency: amountIn.currency,
				to: recipient,
				amount: amountIn.amount,
			})

			return { type: 'transferred', transaction }
		}

		const recipient = {
			chain: currencyOut.chainAddress.chain,
			address: recipientAddress,
		}

		const pendingZap = await this.zapService.swap(user.wallet, {
			currencyIn: amountIn.currency,
			currencyOut,
			amountIn: amountIn.amount,
			recipient,
		})

		return { type: 'zap', pendingZap }
	}
}
