import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	Transaction,
	TransactionQuote,
} from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class WalletWriteService {
	abstract transfer(
		wallet: Wallet,
		args: {
			currency: Currency
			to: ChainAddress
			amount: bigint
		},
	): Promise<Transaction>

	abstract quoteTransfer(
		wallet: Wallet,
		args: {
			currency: Currency
			to: ChainAddress
			amount: bigint
		},
	): Promise<TransactionQuote>
}
