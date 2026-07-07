import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { Transaction } from '../../../domain/value-objects/transaction'

export abstract class SetReferrerCustomFeeUseCase {
	abstract execute(input: {
		referrer: EvmAddress
		feeBps: number
	}): Promise<Transaction>
}
