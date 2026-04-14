import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class WalletService {
	abstract balanceOf(wallet: Wallet, currency: Currency): Promise<bigint>

	abstract transfer(
		wallet: Wallet,
		args: {
			currency: Currency
			to: ChainAddress
			amount: bigint
		},
	): Promise<Transaction>
}
