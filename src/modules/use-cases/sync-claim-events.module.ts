import { Module } from '@nestjs/common'
import { SyncClaimEventsService } from 'src/application/use-cases/sync-claim-events/sync-claim-events.service'
import { SyncClaimEventsUseCase } from 'src/application/use-cases/sync-claim-events/sync-claim-events.use-case'
import { IndexerModule } from 'src/infrastructure/indexer/indexer.module'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'

@Module({
	imports: [IndexerModule, PrismaModule],
	providers: [
		{ provide: SyncClaimEventsUseCase, useClass: SyncClaimEventsService },
	],
	exports: [SyncClaimEventsUseCase],
})
export class SyncClaimEventsModule {}
