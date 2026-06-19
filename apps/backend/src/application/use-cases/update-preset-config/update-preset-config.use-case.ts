import { Config } from '../../../domain/entities/config'
import { Transaction } from '../../../domain/value-objects/transaction'

export abstract class UpdatePresetConfigUseCase {
	abstract execute(input: {
		presetId: number
		config: Omit<Config, 'id'>
	}): Promise<Transaction>
}
