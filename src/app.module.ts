import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RouterModule } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { loadConfig } from './configuration/configuration'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
import { ProvisionModule } from './infrastructure/provision/provision.module'
import { KeeperModule } from './modules/keeper/keeper.module'
import { PriceModule } from './modules/price/price.module'
import { RipsModule } from './modules/rips/rips.module'
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
		ConfigModule.forRoot({ isGlobal: true, load: [loadConfig] }),
		ScheduleModule.forRoot(),
		PrismaModule,
		ProvisionModule,
		UsersModule,
		WalletsModule,
		RipsModule,
		PriceModule,
		KeeperModule,
	],
})
export class AppModule {}
