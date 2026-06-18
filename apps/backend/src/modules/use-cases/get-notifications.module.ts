import { Module } from '@nestjs/common'
import { GetNotificationsService } from '../../application/use-cases/get-notifications/get-notifications.service'
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications/get-notifications.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: GetNotificationsUseCase,
			useClass: GetNotificationsService,
		},
	],
	exports: [GetNotificationsUseCase],
})
export class GetNotificationsModule {}
