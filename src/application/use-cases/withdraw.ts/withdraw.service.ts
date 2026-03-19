import { Inject } from '@nestjs/common'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { resolveChainAddress } from 'src/domain/services/wallet-utils'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { Transaction } from 'src/domain/value-objects/transaction'
import { MAIN_CURRENCY_CHAIN_ADDRESS } from 'src/modules/wallets/wallets.constants'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	InsufficientBalanceError,
	WithdrawInput,
	WithdrawUseCase,
} from './withdraw.use-case'

export class WithdrawService implements WithdrawUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly currencyService: CurrencyService,
		private readonly walletService: WalletService,
		@Inject(MAIN_CURRENCY_CHAIN_ADDRESS)
		private readonly mainCurrencyChainAddress: ChainAddress,
	) {}

	async execute(input: WithdrawInput): Promise<Transaction> {
		const { amount, recipientChainAddress, telegramId } = input

		const user = await this.getUserUseCase.execute({
			telegramId,
		})

		const currency = await this.currencyService.fromAccount(
			this.mainCurrencyChainAddress,
		)

		const userBalance = await this.walletService.balanceOf(
			user.wallet,
			currency,
		)

		if (userBalance < amount)
			throw new InsufficientBalanceError(
				`Insufficient balance, need ${amount}, has ${amount}`,
			)

		const userChainAddress = resolveChainAddress(user.wallet, currency)

		const tx = await this.walletService.transfer(user.wallet, {
			from: userChainAddress,
			to: recipientChainAddress,
			currency,
			amount,
		})

		return tx
	}
}
