import { Module } from '@nestjs/common'
import { KeeperService } from '../../application/use-cases/keeper/keeper.service'
import { KeeperUseCase } from '../../application/use-cases/keeper/keeper.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'
import { RipsInfraModule } from '../../infrastructure/rips/rips.module'
import { GetOngoingRoundsModule } from './get-ongoing-rounds.module'

@Module({
	imports: [GetOngoingRoundsModule, RipsInfraModule, PrismaModule],
	providers: [{ provide: KeeperUseCase, useClass: KeeperService }],
	exports: [KeeperUseCase],
})
export class KeeperUseCaseModule {}
