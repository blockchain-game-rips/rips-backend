import { Module } from '@nestjs/common'
import { ExecutorRepository } from 'src/application/interfaces/repositories/executor.repository'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { WalletRepository } from 'src/application/interfaces/repositories/wallet.repository'
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
		UserRepository,
		ExecutorRepository,
		WalletRepository,
		TicketPrizeRepository,
	],
})
export class PrismaModule {}
