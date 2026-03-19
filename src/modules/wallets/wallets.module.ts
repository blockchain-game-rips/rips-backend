import { Module } from '@nestjs/common'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { GetBalanceService } from 'src/application/use-cases/get-balance/get-balance.service'
import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { CurrencyServiceImpl } from 'src/infrastructure/currency.service'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { PrismaUserRepository } from 'src/infrastructure/prisma/user.repository'
import { WalletServiceImpl } from 'src/infrastructure/wallet.service'
import { WalletsController } from 'src/presentation/wallets/wallets.controller'
import {
	MAIN_CURRENCY_CHAIN_ADDRESS,
	MAIN_CURRENCY_VALUE,
} from './wallets.constants'

@Module({
	imports: [EvmModule],
	controllers: [WalletsController],
	providers: [
		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: GetUserUseCase, useClass: GetUserService },
		{ provide: MAIN_CURRENCY_CHAIN_ADDRESS, useValue: MAIN_CURRENCY_VALUE },
		{ provide: CurrencyService, useClass: CurrencyServiceImpl },
		{ provide: WalletService, useClass: WalletServiceImpl },
		{ provide: GetBalanceUseCase, useClass: GetBalanceService },
	],
})
export class WalletsModule {}
