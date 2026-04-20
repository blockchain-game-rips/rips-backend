import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { AppConfigModule } from './configuration/app-config.module'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { ProvisionModule } from './infrastructure/provision/provision.module'
import { KeeperModule } from './modules/keeper/keeper.module'
import { RipsApiModule } from './modules/rips-api/rips-api.module'
import { SyncCompletedRoundsModule } from './modules/sync-completed-rounds/sync-completed-rounds.module'
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
				module: RipsApiModule,
			},
		]),
		AppConfigModule,
		ScheduleModule.forRoot(),
		PrismaModule,
		ProvisionModule,
		UsersModule,
		WalletsModule,
		RipsApiModule,
		KeeperModule,
		SyncCompletedRoundsModule,
	],
})
export class AppModule {}
