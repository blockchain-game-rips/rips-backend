import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'

export abstract class SetReferrerCustomFeeUseCase {
	abstract execute(input: {
		referrer: EvmAddress
		feeBps: number
	}): Promise<TransactionAttempt>
}
