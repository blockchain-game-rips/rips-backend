import { Module } from '@nestjs/common'
import { SyncClaimEventsWorker } from '../../presentation/sync-claim-events/sync-claim-events.worker'
import { SyncClaimEventsModule as SyncClaimEventsUseCaseModule } from '../use-cases/sync-claim-events.module'

@Module({
	imports: [SyncClaimEventsUseCaseModule],
	providers: [SyncClaimEventsWorker],
})
export class SyncClaimEventsModule {}
