import { Module } from '@nestjs/common'
import { UpdateStakeConfigService } from '../../application/use-cases/update-stake-config/update-stake-config.service'
import { UpdateStakeConfigUseCase } from '../../application/use-cases/update-stake-config/update-stake-config.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [RipsModule, PrismaModule, IndexerModule],
	providers: [
		{
			provide: UpdateStakeConfigUseCase,
			useClass: UpdateStakeConfigService,
		},
	],
	exports: [UpdateStakeConfigUseCase],
})
export class UpdateStakeConfigModule {}
