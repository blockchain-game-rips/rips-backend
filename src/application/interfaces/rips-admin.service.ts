import { EvmAddress } from '../../domain/value-objects/evm-address'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'

export abstract class RipsAdminService {
	abstract pause(wallet: Wallet): Promise<Transaction>

	abstract unpause(wallet: Wallet): Promise<Transaction>

	abstract setReferrerFrozen(
		wallet: Wallet,
		args: { referrer: EvmAddress; frozen: boolean },
	): Promise<Transaction>
}
