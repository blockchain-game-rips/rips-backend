import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'

export abstract class SetDefaultReferralFeeUseCase {
	abstract execute(input: { feeBps: number }): Promise<TransactionAttempt>
}
