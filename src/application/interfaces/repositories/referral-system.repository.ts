import { ReferrerWithStates } from '../../../domain/entities/referrer'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { ReferrerTierTable } from '../../../domain/value-objects/referral-system'

export abstract class ReferralSystemRepository {
	abstract getReferrerByAddress(
		referrer: EvmAddress,
	): Promise<ReferrerWithStates>

	abstract getReferrerTierTables(): Promise<ReferrerTierTable[]>
}
