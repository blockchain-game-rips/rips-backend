import { Injectable } from '@nestjs/common'
import { CurrenciesMismatchError } from '../../../domain/errors/currencies-mismatch.error'
import { TransactionQuote } from '../../../domain/value-objects/transaction'
import { WalletService } from '../../interfaces/wallet.service'
import { GetUserUseCase } from '../get-user/get-user.use-case'
import {
	QuoteWithdrawInput,
	QuoteWithdrawUseCase,
} from './quote-withdraw.use-case'

@Injectable()
export class QuoteWithdrawService extends QuoteWithdrawUseCase {
	constructor(
		private readonly getUserUseCase: GetUserUseCase,
		private readonly walletService: WalletService,
	) {
		super()
	}

	async execute(input: QuoteWithdrawInput): Promise<TransactionQuote> {
		const { telegramId, amountIn, currencyOut, recipientAddress } = input

		if (amountIn.currency.id !== currencyOut.id) {
			throw new CurrenciesMismatchError(
				'quote-withdraw only supports single-chain withdrawals where currency in equals currency out',
			)
		}

		const user = await this.getUserUseCase.execute({ telegramId })

		const recipient = {
			chain: currencyOut.chainAddress.chain,
			address: recipientAddress,
		}

		return this.walletService.quoteTransfer(user.wallet, {
			currency: amountIn.currency,
			to: recipient,
			amount: amountIn.amount,
		})
	}
}
