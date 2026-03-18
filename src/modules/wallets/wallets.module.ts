import { Module } from '@nestjs/common'
import { BalancesService } from 'src/application/interfaces/balances.service'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { GetBalanceService } from 'src/application/use-cases/get-balance/get-balance.service'
import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { BalancesServiceImpl } from 'src/infrastructure/balances.service'
import { CurrencyServiceImpl } from 'src/infrastructure/currency.service'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { PrismaUserRepository } from 'src/infrastructure/prisma/user.repository'
import { WalletsController } from 'src/presentation/wallets/wallets.controller'
import { MAIN_CURRENCY_ACCOUNT, MAIN_CURRENCY_VALUE } from './wallets.constants'

@Module({
	imports: [EvmModule],
	controllers: [WalletsController],
	providers: [
		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: GetUserUseCase, useClass: GetUserService },
		{ provide: MAIN_CURRENCY_ACCOUNT, useValue: MAIN_CURRENCY_VALUE },
		{ provide: CurrencyService, useClass: CurrencyServiceImpl },
		{ provide: BalancesService, useClass: BalancesServiceImpl },
		{ provide: GetBalanceUseCase, useClass: GetBalanceService },
	],
})
export class WalletsModule {}
