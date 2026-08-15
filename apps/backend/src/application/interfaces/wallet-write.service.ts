import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { TransactionQuote } from '../../domain/value-objects/transaction'
import { TransactionAttempt } from '../../domain/value-objects/transaction-attempt'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class WalletWriteService {
	abstract transfer(
		wallet: Wallet,
		args: {
			currency: Currency
			to: ChainAddress
			amount: bigint
		},
	): Promise<TransactionAttempt>

	abstract quoteTransfer(
		wallet: Wallet,
		args: {
			currency: Currency
			to: ChainAddress
			amount: bigint
		},
	): Promise<TransactionQuote>
}
