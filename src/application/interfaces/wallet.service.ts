import { Currency } from 'src/domain/entities/currency'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'

export abstract class WalletService {
	abstract balanceOf(wallet: Wallet, currency: Currency): Promise<bigint>

	abstract transfer(
		wallet: Wallet,
		args: {
			currency: Currency
			from: ChainAddress
			to: ChainAddress
			amount: bigint
		},
	): Promise<Transaction>
}
