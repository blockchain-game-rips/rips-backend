import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'

export abstract class SetReferrerFrozenUseCase {
	abstract execute(input: {
		referrer: EvmAddress
		frozen: boolean
	}): Promise<TransactionAttempt>
}
