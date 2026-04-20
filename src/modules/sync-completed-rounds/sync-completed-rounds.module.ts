import { Module } from '@nestjs/common'
import { SyncCompletedRoundsWorker } from '../../presentation/sync-completed-rounds/sync-completed-rounds.worker'
import { SyncCompletedRoundsModule as SyncCompletedRoundsUseCaseModule } from '../use-cases/sync-completed-rounds.module'

@Module({
	imports: [SyncCompletedRoundsUseCaseModule],
	providers: [SyncCompletedRoundsWorker],
})
export class SyncCompletedRoundsModule {}
