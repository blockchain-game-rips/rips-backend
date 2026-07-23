import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppConfigModule } from './configuration/app-config.module'
import { CurrencyRegistryModule } from './infrastructure/currency-registry/currency-registry.module'
import { LoggingModule } from './infrastructure/logging/logging.module'
import { MetricsModule } from './infrastructure/metrics/metrics.module'
import { PriceOracleModule } from './infrastructure/price-provider/price-provider.module'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { ProvisionModule } from './infrastructure/provision/provision.module'
import { AdminApiModule } from './modules/api/admin-api/admin-api.module'
import { CurrencyApiModule } from './modules/api/currency-api/currency-api.module'
import { NotificationsApiModule } from './modules/api/notifications-api/notifications-api.module'
import { ReferralSystemApiModule } from './modules/api/referral-system-api/referral-system-api.module'
import { RipsApiModule } from './modules/api/rips-api/rips-api.module'
import { UsersApiModule } from './modules/api/users-api/users-api.module'
import { WalletsApiModule } from './modules/api/wallets-api/wallets-api.module'
import { KeeperModule } from './modules/keeper/keeper.module'
import { SyncCompletedRipsModule } from './modules/sync-completed-rips/sync-completed-rips.module'

@Module({
	imports: [
		LoggingModule,
		MetricsModule,
		AppConfigModule,
		CacheModule.register({ isGlobal: true }),
		ScheduleModule.forRoot(),
		PrismaModule,
		ProvisionModule,
		CurrencyRegistryModule,
		PriceOracleModule.forRoot(),
		AdminApiModule,
		CurrencyApiModule,
		UsersApiModule,
		WalletsApiModule,
		RipsApiModule,
		ReferralSystemApiModule,
		KeeperModule,
		SyncCompletedRipsModule,
		NotificationsApiModule,
	],
})
export class AppModule {}
