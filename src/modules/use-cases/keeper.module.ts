import { Module } from '@nestjs/common'
import { HandleClaimService } from 'src/application/use-cases/handle-claim/handle-claim.service'
import { HandleClaimUseCase } from 'src/application/use-cases/handle-claim/handle-claim.use-case'
import { KeeperService } from 'src/application/use-cases/keeper/keeper.service'
import { KeeperUseCase } from 'src/application/use-cases/keeper/keeper.use-case'
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module'
import { RipsInfraModule } from 'src/infrastructure/rips/rips.module'
import { GetRoundsModule } from './get-rounds.module'

@Module({
	imports: [GetRoundsModule, RipsInfraModule, PrismaModule],
	providers: [
		{ provide: HandleClaimUseCase, useClass: HandleClaimService },
		{ provide: KeeperUseCase, useClass: KeeperService },
	],
	exports: [KeeperUseCase],
})
export class KeeperUseCaseModule {}
