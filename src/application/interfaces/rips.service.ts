import { Config } from '../../domain/entities/config'
import { Purchase } from '../../domain/value-objects/purchase'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class RipsService {
	abstract claim(
		wallet: Wallet,
		args: {
			roundId: number
			userAddress: string
			referrerAddress: string | null
		},
	): Promise<Transaction>

	abstract refund(
		wallet: Wallet,
		args: { roundId: number; userAddress: string },
	): Promise<Transaction>

	abstract requestVrf(
		wallet: Wallet,
		args: { roundId: number },
	): Promise<Transaction>

	abstract buyTickets(
		wallet: Wallet,
		args: { stakeId: number; config: Config; ticketCount: number },
	): Promise<Purchase>
}
