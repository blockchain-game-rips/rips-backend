import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { KeeperWorker } from 'src/presentation/keeper/keeper.worker'
import { KeeperUseCaseModule } from '../use-cases/keeper.module'

@Module({
	imports: [ScheduleModule.forRoot(), KeeperUseCaseModule],
	providers: [KeeperWorker],
})
export class KeeperModule {}
