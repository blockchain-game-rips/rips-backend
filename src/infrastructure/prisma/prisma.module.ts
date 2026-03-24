import { Module } from '@nestjs/common'
import { EvmWalletRepository } from 'src/application/interfaces/repositories/evm-wallet.repository'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { PrismaEvmWalletRepository } from './evm-wallet.repository'
import { PrismaService } from './prisma.service'
import { PrismaTicketPrizeRepository } from './ticket-prize.repository'
import { PrismaUserRepository } from './user.repository'

@Module({
	providers: [
		PrismaService,

		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: EvmWalletRepository, useClass: PrismaEvmWalletRepository },
		{
			provide: TicketPrizeRepository,
			useClass: PrismaTicketPrizeRepository,
		},
	],
	exports: [UserRepository, EvmWalletRepository, TicketPrizeRepository],
})
export class PrismaModule {}
