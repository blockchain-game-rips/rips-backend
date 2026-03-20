import { Module } from '@nestjs/common'
import { CurrencyService } from 'src/application/interfaces/currency.service'
import { EvmWalletRepository } from 'src/application/interfaces/repositories/evm-wallet.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { GetBalanceService } from 'src/application/use-cases/get-balance/get-balance.service'
import { GetBalanceUseCase } from 'src/application/use-cases/get-balance/get-balance.use-case'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { WithdrawService } from 'src/application/use-cases/withdraw.ts/withdraw.service'
import { WithdrawUseCase } from 'src/application/use-cases/withdraw.ts/withdraw.use-case'
import { CurrencyServiceImpl } from 'src/infrastructure/currency.service'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { EvmCurrencyWriteService } from 'src/infrastructure/evm/evm-currency-write.service'
import { KmsModule } from 'src/infrastructure/kms/kms.module'
import { PrismaEvmWalletRepository } from 'src/infrastructure/prisma/evm-wallet.repository'
import { PrismaUserRepository } from 'src/infrastructure/prisma/user.repository'
import { SignService } from 'src/infrastructure/sign.service'
import { WalletServiceImpl } from 'src/infrastructure/wallet.service'
import { WalletsController } from 'src/presentation/wallets/wallets.controller'
import {
	MAIN_CURRENCY_CHAIN_ADDRESS,
	MAIN_CURRENCY_VALUE,
} from './wallets.constants'

@Module({
	imports: [EvmModule, KmsModule],
	controllers: [WalletsController],
	providers: [
		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: GetUserUseCase, useClass: GetUserService },
		{ provide: MAIN_CURRENCY_CHAIN_ADDRESS, useValue: MAIN_CURRENCY_VALUE },
		{ provide: CurrencyService, useClass: CurrencyServiceImpl },
		{ provide: WalletService, useClass: WalletServiceImpl },
		{ provide: GetBalanceUseCase, useClass: GetBalanceService },
		{ provide: EvmWalletRepository, useClass: PrismaEvmWalletRepository },
		SignService,
		EvmCurrencyWriteService,
		{ provide: WithdrawUseCase, useClass: WithdrawService },
	],
})
export class WalletsModule {}
