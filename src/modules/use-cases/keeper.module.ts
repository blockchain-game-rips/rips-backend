import { Module } from '@nestjs/common'
import { ExecutorRepository } from 'src/application/interfaces/repositories/executor.repository'
import { HandleClaimService } from 'src/application/use-cases/handle-claim/handle-claim.service'
import { HandleClaimUseCase } from 'src/application/use-cases/handle-claim/handle-claim.use-case'
import { KeeperService } from 'src/application/use-cases/keeper/keeper.service'
import { KeeperUseCase } from 'src/application/use-cases/keeper/keeper.use-case'
import { PrismaExecutorRepository } from 'src/infrastructure/prisma/executor.repository'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { RipsInfraModule } from 'src/infrastructure/rips/rips.module'
import { GetOngoingRoundsModule } from './get-ongoing-rounds.module'

@Module({
	imports: [GetOngoingRoundsModule, RipsInfraModule, PrismaModule],
	providers: [
		{ provide: ExecutorRepository, useClass: PrismaExecutorRepository },
		{ provide: HandleClaimUseCase, useClass: HandleClaimService },
		{ provide: KeeperUseCase, useClass: KeeperService },
	],
	exports: [KeeperUseCase],
})
export class KeeperUseCaseModule {}
