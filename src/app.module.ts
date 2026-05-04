import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppConfigModule } from './configuration/app-config.module'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { ProvisionModule } from './infrastructure/provision/provision.module'
import { CurrencyApiModule } from './modules/api/currency-api/currency-api.module'
import { NotificationsApiModule } from './modules/api/notifications-api/notifications-api.module'
import { ReferralSystemApiModule } from './modules/api/referral-system-api/referral-system-api.module'
import { RipsApiModule } from './modules/api/rips-api/rips-api.module'
import { UsersApiModule } from './modules/api/users-api/users-api.module'
import { WalletsApiModule } from './modules/api/wallets-api/wallets-api.module'
import { KeeperModule } from './modules/keeper/keeper.module'
import { SyncCompletedRoundsModule } from './modules/sync-completed-rounds/sync-completed-rounds.module'
import { LoggingMiddleware } from './presentation/middleware/logging.middleware'

@Module({
	imports: [
		AppConfigModule,
		ScheduleModule.forRoot(),
		PrismaModule,
		ProvisionModule,
		CurrencyApiModule,
		UsersApiModule,
		WalletsApiModule,
		RipsApiModule,
		ReferralSystemApiModule,
		KeeperModule,
		SyncCompletedRoundsModule,
		NotificationsApiModule,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(LoggingMiddleware).forRoutes('*')
	}
}
