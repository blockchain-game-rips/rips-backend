import { Module } from '@nestjs/common'
import { RouterModule } from '@nestjs/core'
import { PrismaModule } from './infrastructure/prisma/prisma.module'
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
		]),
		PrismaModule,
		UsersModule,
		WalletsModule,
	],
})
export class AppModule {}
