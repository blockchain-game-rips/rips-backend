import { Module } from '@nestjs/common'
import { SyncSettlingRipsService } from '../../application/use-cases/sync-settling-rips/sync-settling-rips.service'
import { SyncSettlingRipsUseCase } from '../../application/use-cases/sync-settling-rips/sync-settling-rips.use-case'
import { IndexerModule } from '../../infrastructure/indexer/indexer.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [IndexerModule, PrismaModule],
	providers: [
		{
			provide: SyncSettlingRipsUseCase,
			useClass: SyncSettlingRipsService,
		},
	],
	exports: [SyncSettlingRipsUseCase],
})
export class SyncSettlingRipsModule {}
