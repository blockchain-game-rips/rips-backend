import { Module } from '@nestjs/common'
import { MetricsModule } from '../../infrastructure/metrics/metrics.module'
import { SyncCompletedRipsWorker } from '../../presentation/sync-completed-rips/sync-completed-rips.worker'
import { SyncCompletedRipsModule as SyncCompletedRipsUseCaseModule } from '../use-cases/sync-completed-rips.module'

@Module({
	imports: [SyncCompletedRipsUseCaseModule, MetricsModule],
	providers: [SyncCompletedRipsWorker],
})
export class SyncCompletedRipsModule {}
