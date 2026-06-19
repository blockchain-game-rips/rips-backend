import { Module } from '@nestjs/common'
import { UpdatePresetConfigService } from '../../application/use-cases/update-preset-config/update-preset-config.service'
import { UpdatePresetConfigUseCase } from '../../application/use-cases/update-preset-config/update-preset-config.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'

@Module({
	imports: [RipsModule, PrismaModule, IndexerModule],
	providers: [
		{
			provide: UpdatePresetConfigUseCase,
			useClass: UpdatePresetConfigService,
		},
	],
	exports: [UpdatePresetConfigUseCase],
})
export class UpdatePresetConfigModule {}
