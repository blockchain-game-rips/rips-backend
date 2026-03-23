import { Module } from '@nestjs/common'
import { EvmWalletRepository } from 'src/application/interfaces/repositories/evm-wallet.repository'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { BuyTicketsService } from 'src/application/use-cases/buy-tickets/buy-tickets.service'
import { BuyTicketsUseCase } from 'src/application/use-cases/buy-tickets/buy-tickets.use-case'
import { GetStakesService } from 'src/application/use-cases/get-stakes/get-stakes.service'
import { GetStakesUseCase } from 'src/application/use-cases/get-stakes/get-stakes.use-case'
import { GetUserService } from 'src/application/use-cases/get-user/get-user.service'
import { GetUserUseCase } from 'src/application/use-cases/get-user/get-user.use-case'
import { EvmCurrencyWriteService } from 'src/infrastructure/evm/evm-currency-write.service'
import { EvmModule } from 'src/infrastructure/evm/evm.module'
import { IndexerService } from 'src/infrastructure/indexer/indexer.service'
import { IndexerStakeRepository } from 'src/infrastructure/indexer/stake.repository'
import { KmsModule } from 'src/infrastructure/kms/kms.module'
import { PrismaEvmWalletRepository } from 'src/infrastructure/prisma/evm-wallet.repository'
import { PrismaUserRepository } from 'src/infrastructure/prisma/user.repository'
import { RipsWriteService } from 'src/infrastructure/rips/rips-write.service'
import { RIPS_SC_ADDRESS } from 'src/infrastructure/rips/rips.constants'
import { SignService } from 'src/infrastructure/sign.service'
import { WalletServiceImpl } from 'src/infrastructure/wallet.service'
import { MainCurrencyModule } from 'src/modules/main-currency/main-currency.module'
import { RipsController } from 'src/presentation/rips/rips.controller'
import { getEnvSafe } from 'src/utils/common'

@Module({
	imports: [MainCurrencyModule, EvmModule, KmsModule],
	controllers: [RipsController],
	providers: [
		IndexerService,
		{ provide: StakeRepository, useClass: IndexerStakeRepository },
		{ provide: GetStakesUseCase, useClass: GetStakesService },
		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: GetUserUseCase, useClass: GetUserService },
		{ provide: EvmWalletRepository, useClass: PrismaEvmWalletRepository },
		{ provide: WalletService, useClass: WalletServiceImpl },
		{ provide: BuyTicketsUseCase, useClass: BuyTicketsService },
		{
			provide: RIPS_SC_ADDRESS,
			useFactory: () => getEnvSafe('RIPS_CONTRACT_ADDRESS'),
		},
		SignService,
		EvmCurrencyWriteService,
		RipsWriteService,
	],
	exports: [RipsWriteService],
})
export class RipsModule {}
