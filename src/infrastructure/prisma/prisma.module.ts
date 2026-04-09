import { Module } from '@nestjs/common'
import { TicketPrizeRepository } from 'src/application/interfaces/repositories/ticket-prize.repository'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { WalletRepository } from 'src/application/interfaces/repositories/wallet.repository'
import { PrismaService } from './prisma.service'
import { PrismaTicketPrizeRepository } from './ticket-prize.repository'
import { PrismaUserRepository } from './user.repository'
import { PrismaWalletRepository } from './wallet.repository'

@Module({
	providers: [
		PrismaService,

		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: WalletRepository, useClass: PrismaWalletRepository },
		{
			provide: TicketPrizeRepository,
			useClass: PrismaTicketPrizeRepository,
		},
	],
	exports: [UserRepository, WalletRepository, TicketPrizeRepository],
})
export class PrismaModule {}
