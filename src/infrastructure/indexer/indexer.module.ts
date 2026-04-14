import { Module } from '@nestjs/common'
import { RoundRepository } from '../../application/interfaces/repositories/round.repository'
import { StakeRepository } from '../../application/interfaces/repositories/stake.repository'
import { MainCurrencyModule } from '../../modules/main-currency/main-currency.module'
import { IndexerService } from './indexer.service'
import { IndexerRoundRepository } from './rounds.repository'
import { IndexerStakeRepository } from './stake.repository'

@Module({
	imports: [MainCurrencyModule],
	providers: [
		IndexerService,
		{ provide: StakeRepository, useClass: IndexerStakeRepository },
		{ provide: RoundRepository, useClass: IndexerRoundRepository },
	],
	exports: [StakeRepository, RoundRepository],
})
export class IndexerModule {}
