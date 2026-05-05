import { Transaction } from '../../../domain/value-objects/transaction'

export abstract class SetPausedUseCase {
	abstract execute(input: { isPaused: boolean }): Promise<Transaction>
}
