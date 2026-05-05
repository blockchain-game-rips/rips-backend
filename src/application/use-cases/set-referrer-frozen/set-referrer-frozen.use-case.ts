import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { Transaction } from '../../../domain/value-objects/transaction'

export abstract class SetReferrerFrozenUseCase {
	abstract execute(input: {
		referrer: EvmAddress
		frozen: boolean
	}): Promise<Transaction>
}
