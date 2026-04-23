import { Config } from '../../domain/entities/config'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { PurchaseReceipt } from '../../domain/value-objects/purchase-receipt'
import { Reward } from '../../domain/value-objects/reward'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class RipsService {
	abstract claim(
		wallet: Wallet,
		args: {
			roundId: number
			userAddress: EvmAddress
			referrerAddress: EvmAddress | null
		},
	): Promise<Transaction>

	abstract refund(
		wallet: Wallet,
		args: { roundId: number; userAddress: EvmAddress },
	): Promise<Transaction>

	abstract requestVrf(
		wallet: Wallet,
		args: { roundId: number },
	): Promise<Transaction>

	abstract buyTickets(
		wallet: Wallet,
		args: { stakeId: number; config: Config; ticketCount: number },
	): Promise<PurchaseReceipt>

	abstract withdrawReward(
		wallet: Wallet,
		args: { currencyAddress: EvmAddress },
	): Promise<Reward>
}
