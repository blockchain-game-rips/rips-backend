import { Module } from '@nestjs/common'
import { AdminWalletRepository } from '../../application/interfaces/repositories/admin-wallet.repository'
import { EntryPayoutRepository } from '../../application/interfaces/repositories/entry-payout.repository'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { NotificationRepository } from '../../application/interfaces/repositories/notification.repository'
import { RipSyncRepository } from '../../application/interfaces/repositories/rip-sync.repository'
import { UserRepository } from '../../application/interfaces/repositories/user.repository'
import { WalletRepository } from '../../application/interfaces/repositories/wallet.repository'
import { MetricsModule } from '../metrics/metrics.module'
import { PrismaAdminWalletRepository } from './admin-wallet.repository'
import { PrismaEntryPayoutRepository } from './entry-payout.repository'
import { PrismaExecutorRepository } from './executor.repository'
import { PrismaNotificationRepository } from './notification.repository'
import { PrismaService } from './prisma.service'
import { PrismaRipSyncRepository } from './rip-sync.repository'
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
			provide: AdminWalletRepository,
			useClass: PrismaAdminWalletRepository,
		},
		{
			provide: EntryPayoutRepository,
			useClass: PrismaEntryPayoutRepository,
		},
		{ provide: RipSyncRepository, useClass: PrismaRipSyncRepository },
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
		AdminWalletRepository,
		EntryPayoutRepository,
		RipSyncRepository,
		NotificationRepository,
	],
})
export class PrismaModule {}
