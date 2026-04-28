import { Injectable } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import { InsufficientBalanceError } from '../../../domain/errors/insufficient-balance.error'
import { Transaction } from '../../../domain/value-objects/transaction'
import { WalletService } from '../../interfaces/wallet.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { WithdrawInput, WithdrawUseCase } from './withdraw.use-case'

@Injectable()
export class WithdrawService implements WithdrawUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletService: WalletService,
	) {}

	async execute(input: WithdrawInput): Promise<Transaction> {
		const { telegramId, amountIn, currencyOut, recipientAddress } = input

		if (amountIn.currency.id !== currencyOut.id) {
			throw new CurrenciesMismatchError(
				`Currency in ${amountIn.currency.id} does not match currency out ${currencyOut.id} — use swap withdrawal instead`,
			)
		}

		const user = await this.getUserUseCase.execute({ telegramId })

		const userBalance = await this.walletService.balanceOf(
			user.wallet,
			amountIn.currency,
		)

		if (userBalance < amountIn.amount) {
			throw new InsufficientBalanceError(
				`Insufficient balance, need ${amountIn.amount}, has ${userBalance}`,
			)
		}

		const recipient = {
			chain: amountIn.currency.chainAddress.chain,
			address: recipientAddress,
		}

		return this.walletService.transfer(user.wallet, {
			currency: amountIn.currency,
			to: recipient,
			amount: amountIn.amount,
		})
	}
}
