import { Config } from '../../../domain/entities/config'
import { Transaction } from '../../../domain/value-objects/transaction'

export abstract class UpdateStakeConfigUseCase {
	abstract execute(input: {
		stakeId: number
		config: Config
	}): Promise<Transaction>
}
