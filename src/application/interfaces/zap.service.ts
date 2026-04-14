import { Config } from 'src/domain/entities/config'
import { Currency } from 'src/domain/entities/currency'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'

export abstract class ZapService {
	abstract quote(
		wallet: Wallet,
		args: {
			stakeId: number
			config: Config
			paymentCurrency: Currency
			ticketCount: number
		},
	): Promise<bigint>

	abstract buyTickets(
		wallet: Wallet,
		args: {
			paymentCurrency: Currency
			stakeId: number
			config: Config
			ticketCount: number
		},
	): Promise<Transaction>
}
