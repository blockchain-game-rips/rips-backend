import { Inject, Injectable } from '@nestjs/common'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { Currency } from 'src/domain/entities/currency'
import { Config } from 'src/domain/entities/stake'
import { IndexerService } from './indexer.service'
import { fromStakeRaw } from './utils'

@Injectable()
export class IndexerStakeRepository extends StakeRepository {
	constructor(
		private readonly indexer: IndexerService,
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {
		super()
	}

	async getStakes(): Promise<Config[]> {
		const { stakeConfigs } = await this.indexer.sdk.GetStakes()

		return stakeConfigs.map((stakeRaw) =>
			fromStakeRaw(stakeRaw, this.mainCurrency),
		)
	}
}
