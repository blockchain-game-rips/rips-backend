import { Config } from '../../domain/entities/config'
import { CurrencyAmount } from '../../domain/value-objects/currency-amount'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { Purchase } from '../../domain/value-objects/purchase'
import { TransactionQuote } from '../../domain/value-objects/transaction'
import {
	TransactionAttempt,
	TransactionAttemptWith,
} from '../../domain/value-objects/transaction-attempt'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class RipsService {
	abstract claim(
		wallet: Wallet,
		args: {
			ripId: number
			userAddress: EvmAddress
			referrerAddress: EvmAddress | null
		},
	): Promise<TransactionAttempt>

	abstract refund(
		wallet: Wallet,
		args: { ripId: number; userAddress: EvmAddress },
	): Promise<TransactionAttempt>

	abstract requestVrf(
		wallet: Wallet,
		args: { ripId: number },
	): Promise<TransactionAttempt>

	abstract quoteBuyEntries(): Promise<TransactionQuote>

	abstract buyEntries(
		wallet: Wallet,
		args: { presetId: number; config: Config; entryCount: number },
	): Promise<TransactionAttemptWith<Purchase>>

	abstract quoteWithdrawReward(): Promise<TransactionQuote>

	abstract withdrawReward(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress },
	): Promise<TransactionAttemptWith<CurrencyAmount>>
}
