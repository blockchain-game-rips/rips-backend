import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { ReferrerTier } from '../../../domain/value-objects/referral-system'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'

export abstract class SetReferralTiersUseCase {
	abstract execute(input: {
		currencyAddress: EvmAddress
		tiers: ReferrerTier[]
	}): Promise<TransactionAttempt>
}
