import { Module } from '@nestjs/common'
import { ReferralSystemRepository } from '../../application/interfaces/repositories/referral-system.repository'
import { RoundRepository } from '../../application/interfaces/repositories/round.repository'
import { StakeRepository } from '../../application/interfaces/repositories/stake.repository'
import { EvmModule } from '../evm/evm.module'
import { RipsModule } from '../rips/rips.module'
import { IndexerService } from './indexer.service'
import { IndexerReferralSystemRepository } from './referral-system.repository'
import { IndexerRoundRepository } from './rounds.repository'
import { IndexerStakeRepository } from './stake.repository'

@Module({
	imports: [EvmModule, RipsModule],
	providers: [
		IndexerService,
		{ provide: StakeRepository, useClass: IndexerStakeRepository },
		{ provide: RoundRepository, useClass: IndexerRoundRepository },
		{
			provide: ReferralSystemRepository,
			useClass: IndexerReferralSystemRepository,
		},
	],
	exports: [StakeRepository, RoundRepository, ReferralSystemRepository],
})
export class IndexerModule {}
