import { Inject, Injectable } from '@nestjs/common'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { Currency } from 'src/domain/entities/currency'
import { InsufficientBalanceError } from 'src/domain/errors/insufficient-balance.error'
import { resolveChainAddress } from 'src/domain/services/wallet-utils'
import { Transaction } from 'src/domain/value-objects/transaction'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import { WithdrawInput, WithdrawUseCase } from './withdraw.use-case'

@Injectable()
export class WithdrawService implements WithdrawUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletService: WalletService,
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {}

	async execute(input: WithdrawInput): Promise<Transaction> {
		const { amount, recipientChainAddress, telegramId } = input

		const user = await this.getUserUseCase.execute({ telegramId })

		const userBalance = await this.walletService.balanceOf(
			user.wallet,
			this.mainCurrency,
		)

		if (userBalance < amount)
			throw new InsufficientBalanceError(
				`Insufficient balance, need ${amount}, has ${amount}`,
			)

		const userChainAddress = resolveChainAddress(
			user.wallet,
			this.mainCurrency,
		)

		const tx = await this.walletService.transfer(user.wallet, {
			from: userChainAddress,
			to: recipientChainAddress,
			currency: this.mainCurrency,
			amount,
		})

		return tx
	}
}
