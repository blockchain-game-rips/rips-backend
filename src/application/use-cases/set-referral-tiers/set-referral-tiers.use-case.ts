import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { ReferrerTier } from '../../../domain/value-objects/referral-system'
import { Transaction } from '../../../domain/value-objects/transaction'

export abstract class SetReferralTiersUseCase {
	abstract execute(input: {
		currencyAddress: EvmAddress
		tiers: ReferrerTier[]
	}): Promise<Transaction>
}
