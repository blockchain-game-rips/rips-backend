import { Injectable } from '@nestjs/common'
import { InsufficientBalanceError } from '../../../domain/errors/insufficient-balance.error'
import { Transaction } from '../../../domain/value-objects/transaction'
import { CurrencyService } from '../../interfaces/currency.service'
import { WalletService } from '../../interfaces/wallet.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { WithdrawInput, WithdrawUseCase } from './withdraw.use-case'

@Injectable()
export class WithdrawService implements WithdrawUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletService: WalletService,
		private readonly currencyService: CurrencyService,
	) {}

	async execute(input: WithdrawInput): Promise<Transaction> {
		const {
			amount,
			recipientChainAddress,
			currencyChainAddress,
			telegramId,
		} = input

		const user = await this.getUserUseCase.execute({ telegramId })

		const currency =
			await this.currencyService.fromAccount(currencyChainAddress)

		const userBalance = await this.walletService.balanceOf(
			user.wallet,
			currency,
		)

		if (userBalance < amount)
			throw new InsufficientBalanceError(
				`Insufficient balance, need ${amount}, has ${amount}`,
			)

		const tx = await this.walletService.transfer(user.wallet, {
			to: recipientChainAddress,
			currency,
			amount,
		})

		return tx
	}
}
