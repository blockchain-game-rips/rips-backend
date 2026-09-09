import { Module } from '@nestjs/common'
import { APP_GUARD, DiscoveryModule } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { AppConfigModule } from './configuration/app-config.module'
import { AppCacheModule } from './infrastructure/cache/app-cache.module'
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
import { ExecutorHealthModule } from './modules/executor-health/executor-health.module'
import { KeeperModule } from './modules/keeper/keeper.module'
import { SyncSettlingRipsModule } from './modules/sync-settling-rips/sync-settling-rips.module'
import { AccessCoverageValidator } from './presentation/shared/access/access-coverage.validator'
import { AccessGuard } from './presentation/shared/access/access.guard'

@Module({
	imports: [
		DiscoveryModule,
		LoggingModule,
		MetricsModule,
		AppConfigModule,
		AppCacheModule,
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
		ExecutorHealthModule,
		SyncSettlingRipsModule,
		NotificationsApiModule,
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: AccessGuard,
		},
		AccessCoverageValidator,
	],
})
export class AppModule {}
