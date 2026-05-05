import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class RipsAdminService {
	abstract pause(wallet: Wallet): Promise<Transaction>
	abstract unpause(wallet: Wallet): Promise<Transaction>
}
