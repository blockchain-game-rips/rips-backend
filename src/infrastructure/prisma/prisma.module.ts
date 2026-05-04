import { Module } from '@nestjs/common'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { NotificationRepository } from '../../application/interfaces/repositories/notification.repository'
import { RoundSyncRepository } from '../../application/interfaces/repositories/round-sync.repository'
import { TicketPrizeRepository } from '../../application/interfaces/repositories/ticket-prize.repository'
import { UserRepository } from '../../application/interfaces/repositories/user.repository'
import { WalletRepository } from '../../application/interfaces/repositories/wallet.repository'
import { MetricsModule } from '../metrics/metrics.module'
import { PrismaExecutorRepository } from './executor.repository'
import { PrismaNotificationRepository } from './notification.repository'
import { PrismaService } from './prisma.service'
import { PrismaRoundSyncRepository } from './round-sync.repository'
import { PrismaTicketPrizeRepository } from './ticket-prize.repository'
import { PrismaUserRepository } from './user.repository'
import { PrismaWalletRepository } from './wallet.repository'

@Module({
	imports: [MetricsModule],
	providers: [
		PrismaService,

		{ provide: UserRepository, useClass: PrismaUserRepository },
		{ provide: ExecutorRepository, useClass: PrismaExecutorRepository },
		{ provide: WalletRepository, useClass: PrismaWalletRepository },
		{
			provide: TicketPrizeRepository,
			useClass: PrismaTicketPrizeRepository,
		},
		{ provide: RoundSyncRepository, useClass: PrismaRoundSyncRepository },
		{
			provide: NotificationRepository,
			useClass: PrismaNotificationRepository,
		},
	],
	exports: [
		PrismaService,
		UserRepository,
		ExecutorRepository,
		WalletRepository,
		TicketPrizeRepository,
		RoundSyncRepository,
		NotificationRepository,
	],
})
export class PrismaModule {}
