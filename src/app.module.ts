import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppConfigModule } from './configuration/app-config.module'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { ProvisionModule } from './infrastructure/provision/provision.module'
import { KeeperModule } from './modules/keeper/keeper.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { ReferralSystemModule } from './modules/referral-system/referral-system.module'
import { RipsApiModule } from './modules/rips-api/rips-api.module'
import { SyncCompletedRoundsModule } from './modules/sync-completed-rounds/sync-completed-rounds.module'
import { UsersModule } from './modules/users/users.module'
import { WalletsModule } from './modules/wallets/wallets.module'
import { LoggingMiddleware } from './presentation/middleware/logging.middleware'

@Module({
	imports: [
		AppConfigModule,
		ScheduleModule.forRoot(),
		PrismaModule,
		ProvisionModule,
		UsersModule,
		WalletsModule,
		RipsApiModule,
		ReferralSystemModule,
		KeeperModule,
		SyncCompletedRoundsModule,
		NotificationsModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggingMiddleware).forRoutes('*')
	}
}
