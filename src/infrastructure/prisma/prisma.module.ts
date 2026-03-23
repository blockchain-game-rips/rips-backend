import { Module } from '@nestjs/common'
import { EvmWalletRepository } from 'src/application/interfaces/repositories/evm-wallet.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { PrismaEvmWalletRepository } from './evm-wallet.repository'
import { PrismaService } from './prisma.service'
import { PrismaUserRepository } from './user.repository'

@Module({
	providers: [
		PrismaService,

		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: EvmWalletRepository, useClass: PrismaEvmWalletRepository },
	],
	exports: [UserRepository, EvmWalletRepository],
})
export class PrismaModule {}
