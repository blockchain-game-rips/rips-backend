import { Injectable } from '@nestjs/common'
import { ReferrerTierTable } from '../../../domain/value-objects/referral-system'
import { GetReferrerTierTablesUseCase } from './get-referrer-tier-tables.use-case'

@Injectable()
export class GetReferrerTierTablesService extends GetReferrerTierTablesUseCase {
	async execute(): Promise<ReferrerTierTable[]> {
		throw new Error('TODO: implement get referrer tier tables')
	}
}
