import { Module } from '@nestjs/common'
import { MetricsModule } from '../../infrastructure/metrics/metrics.module'
import { KeeperWorker } from '../../presentation/keeper/keeper.worker'
import { KeeperUseCaseModule } from '../use-cases/keeper.module'

@Module({
	imports: [KeeperUseCaseModule, MetricsModule],
	providers: [KeeperWorker],
})
export class KeeperModule {}
