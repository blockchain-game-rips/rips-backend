import { Module } from '@nestjs/common'
import { RewardRepository } from '../../application/interfaces/repositories/reward.repository'
import { RoundRepository } from '../../application/interfaces/repositories/round.repository'
import { StakeRepository } from '../../application/interfaces/repositories/stake.repository'
import { EvmModule } from '../evm/evm.module'
import { RipsModule } from '../rips/rips.module'
import { IndexerService } from './indexer.service'
import { IndexerRoundRepository } from './rounds.repository'
import { IndexerStakeRepository } from './stake.repository'

@Module({
	imports: [EvmModule, RipsModule],
	providers: [
		IndexerService,
		{ provide: StakeRepository, useClass: IndexerStakeRepository },
		{ provide: RoundRepository, useClass: IndexerRoundRepository },
	],
	exports: [StakeRepository, RoundRepository, RewardRepository],
})
export class IndexerModule {}
