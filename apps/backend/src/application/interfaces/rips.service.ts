import { Config } from '../../domain/entities/config'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { PurchaseReceipt } from '../../domain/value-objects/purchase-receipt'
import { Reward } from '../../domain/value-objects/reward'
import {
	Transaction,
	TransactionQuote,
} from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class RipsService {
	abstract claim(
		wallet: Wallet,
		args: {
			ripId: number
			userAddress: EvmAddress
			referrerAddress: EvmAddress | null
		},
	): Promise<Transaction>

	abstract refund(
		wallet: Wallet,
		args: { ripId: number; userAddress: EvmAddress },
	): Promise<Transaction>

	abstract requestVrf(
		wallet: Wallet,
		args: { ripId: number },
	): Promise<Transaction>

	abstract quoteBuyEntries(): Promise<TransactionQuote>

	abstract buyEntries(
		wallet: Wallet,
		args: { presetId: number; config: Config; entryCount: number },
	): Promise<PurchaseReceipt>

	abstract quoteWithdrawReward(): Promise<TransactionQuote>

	abstract withdrawReward(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress },
	): Promise<Reward>
}
