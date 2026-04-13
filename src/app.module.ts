import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { AppConfigModule } from './configuration/app-config.module'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { ProvisionModule } from './infrastructure/provision/provision.module'
import { KeeperModule } from './modules/keeper/keeper.module'
import { PriceModule } from './modules/price/price.module'
import { RipsModule } from './modules/rips/rips.module'
import { SyncClaimEventsModule } from './modules/sync-claim-events/sync-claim-events.module'
import { UsersModule } from './modules/users/users.module'
import { WalletsModule } from './modules/wallets/wallets.module'

@Module({
	imports: [
		RouterModule.register([
			{
				path: 'users',
				module: UsersModule,
				children: [
					{
						path: ':telegramId/wallet',
						module: WalletsModule,
					},
				],
			},
			{
				path: 'rips',
				module: RipsModule,
			},
			{
				path: 'price',
				module: PriceModule,
			},
		]),
		AppConfigModule,
		ScheduleModule.forRoot(),
		PrismaModule,
		ProvisionModule,
		UsersModule,
		WalletsModule,
		RipsModule,
		PriceModule,
		KeeperModule,
		SyncClaimEventsModule,
	],
})
export class AppModule {}
