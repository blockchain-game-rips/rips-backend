import { Inject, Injectable } from '@nestjs/common'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { Currency } from 'src/domain/entities/currency'
import { Stake } from 'src/domain/entities/stake'
import { IndexerService } from './indexer.service'

@Injectable()
export class IndexerStakeRepository extends StakeRepository {
	constructor(
		private readonly indexer: IndexerService,
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {
		super()
	}

	async getStakes(): Promise<Stake[]> {
		const { stakeConfigs } = await this.indexer.sdk.GetStakes()

		return stakeConfigs.map((config) => ({
			id: Number(config.id),
			ticketCup: Number(config.ticketCap),
			ticketPrice: {
				currency: this.mainCurrency,
				amount: BigInt(config.ticketCost),
			},
			duration: Number(config.duration),
		}))
	}
}
