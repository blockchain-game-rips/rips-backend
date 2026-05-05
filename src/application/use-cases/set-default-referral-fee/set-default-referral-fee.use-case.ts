import { Transaction } from '../../../domain/value-objects/transaction'

export abstract class SetDefaultReferralFeeUseCase {
	abstract execute(input: { feePercent: number }): Promise<Transaction>
}
