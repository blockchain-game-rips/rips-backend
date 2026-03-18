import { Module } from '@nestjs/common'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { GetBalanceService } from 'src/application/use-cases/get-balance/get-balance.service'
import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { PrismaUserRepository } from 'src/infrastructure/prisma/user.repository'
import { WalletsController } from 'src/presentation/wallets/wallets.controller'
import { MAIN_CHAIN_ID, MAIN_CHAIN_ID_VALUE } from './wallets.constants'

@Module({
	imports: [EvmModule],
	controllers: [WalletsController],
	providers: [
		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: GetUserUseCase, useClass: GetUserService },
		{ provide: MAIN_CHAIN_ID, useValue: MAIN_CHAIN_ID_VALUE },
		{ provide: GetBalanceUseCase, useClass: GetBalanceService },
	],
})
export class WalletsModule {}
