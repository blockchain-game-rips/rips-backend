import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'

export abstract class SetPausedUseCase {
	abstract execute(input: { isPaused: boolean }): Promise<TransactionAttempt>
}
