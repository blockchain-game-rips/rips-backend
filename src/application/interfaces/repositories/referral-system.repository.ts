import { ReferrerWithStates } from '../../../domain/entities/referrer'
import { EvmAddress } from '../../../domain/value-objects/evm-address'

export abstract class ReferralSystemRepository {
	abstract getReferrerByAddress(
		referrer: EvmAddress,
	): Promise<ReferrerWithStates>
}
