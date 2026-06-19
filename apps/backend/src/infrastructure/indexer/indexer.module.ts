import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { PresetRepository } from '../../application/interfaces/repositories/preset.repository'
import { ReferralSystemRepository } from '../../application/interfaces/repositories/referral-system.repository'
import { RipRepository } from '../../application/interfaces/repositories/rip.repository'
import { EvmModule } from '../evm/evm.module'
import { RipsModule } from '../rips/rips.module'
import { IndexerService } from './indexer.service'
import { IndexerPresetRepository } from './preset.repository'
import { IndexerReferralSystemRepository } from './referral-system.repository'
import { IndexerRipRepository } from './rips.repository'

@Module({
	imports: [CacheModule.register(), EvmModule, RipsModule],
	providers: [
		IndexerService,
		{ provide: PresetRepository, useClass: IndexerPresetRepository },
		{ provide: RipRepository, useClass: IndexerRipRepository },
		{
			provide: ReferralSystemRepository,
			useClass: IndexerReferralSystemRepository,
		},
	],
	exports: [PresetRepository, RipRepository, ReferralSystemRepository],
})
export class IndexerModule {}
