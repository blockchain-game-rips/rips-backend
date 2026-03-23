import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RouterModule } from '@nestjs/core'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
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
		]),
		ConfigModule.forRoot({ isGlobal: true }),
		PrismaModule,
		UsersModule,
		WalletsModule,
		RipsModule,
	],
})
export class AppModule {}
