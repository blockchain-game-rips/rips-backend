import { Config } from '../../../domain/entities/config'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'

export abstract class UpdatePresetConfigUseCase {
	abstract execute(input: {
		presetId: number
		config: Omit<Config, 'id'>
	}): Promise<TransactionAttempt>
}
