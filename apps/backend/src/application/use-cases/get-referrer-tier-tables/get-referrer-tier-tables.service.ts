import { Injectable } from '@nestjs/common'
import { ReferrerTierTable } from '../../../domain/value-objects/referral-system'
import { ReferralSystemRepository } from '../../interfaces/repositories/referral-system.repository'
import { GetReferrerTierTablesUseCase } from './get-referrer-tier-tables.use-case'

@Injectable()
export class GetReferrerTierTablesService extends GetReferrerTierTablesUseCase {
	constructor(private readonly referrerRepository: ReferralSystemRepository) {
		super()
	}

	async execute(): Promise<ReferrerTierTable[]> {
		const tables = await this.referrerRepository.getReferrerTierTables()

		return tables
	}
}
