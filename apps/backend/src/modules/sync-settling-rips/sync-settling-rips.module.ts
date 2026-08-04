import { Module } from '@nestjs/common'
import { MetricsModule } from '../../infrastructure/metrics/metrics.module'
import { SyncSettlingRipsWorker } from '../../presentation/sync-settling-rips/sync-settling-rips.worker'
import { SyncSettlingRipsModule as SyncSettlingRipsUseCaseModule } from '../use-cases/sync-settling-rips.module'

@Module({
	imports: [SyncSettlingRipsUseCaseModule, MetricsModule],
	providers: [SyncSettlingRipsWorker],
})
export class SyncSettlingRipsModule {}
