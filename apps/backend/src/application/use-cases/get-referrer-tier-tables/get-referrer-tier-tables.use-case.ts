import { ReferrerTierTable } from '../../../domain/value-objects/referral-system'

export abstract class GetReferrerTierTablesUseCase {
	abstract execute(): Promise<ReferrerTierTable[]>
}
