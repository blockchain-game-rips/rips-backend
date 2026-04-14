import { Module } from '@nestjs/common'
import { KeeperWorker } from '../../presentation/keeper/keeper.worker'
import { KeeperUseCaseModule } from '../use-cases/keeper.module'

@Module({
	imports: [KeeperUseCaseModule],
	providers: [KeeperWorker],
})
export class KeeperModule {}
