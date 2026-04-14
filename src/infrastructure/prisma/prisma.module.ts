import { Module } from '@nestjs/common'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { TicketPrizeRepository } from '../../application/interfaces/repositories/ticket-prize.repository'
import { UserRepository } from '../../application/interfaces/repositories/user.repository'
import { WalletRepository } from '../../application/interfaces/repositories/wallet.repository'
import { PrismaExecutorRepository } from './executor.repository'
import { PrismaService } from './prisma.service'
import { PrismaTicketPrizeRepository } from './ticket-prize.repository'
import { PrismaUserRepository } from './user.repository'
import { PrismaWalletRepository } from './wallet.repository'

@Module({
	providers: [
		PrismaService,

		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: ExecutorRepository, useClass: PrismaExecutorRepository },
		{ provide: WalletRepository, useClass: PrismaWalletRepository },
		{
			provide: TicketPrizeRepository,
			useClass: PrismaTicketPrizeRepository,
		},
	],
	exports: [
		PrismaService,
		UserRepository,
		ExecutorRepository,
		WalletRepository,
		TicketPrizeRepository,
	],
})
export class PrismaModule {}
