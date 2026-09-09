import { Module } from '@nestjs/common'
import { KeeperService } from '../../application/use-cases/keeper/keeper.service'
import { KeeperUseCase } from '../../application/use-cases/keeper/keeper.use-case'
import { MetricsModule } from '../../infrastructure/metrics/metrics.module'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsModule } from '../../infrastructure/rips/rips.module'
import { GetOngoingRipsModule } from './get-ongoing-rips.module'

@Module({
	imports: [GetOngoingRipsModule, RipsModule, PrismaModule, MetricsModule],
	providers: [{ provide: KeeperUseCase, useClass: KeeperService }],
	exports: [KeeperUseCase],
})
export class KeeperUseCaseModule {}
