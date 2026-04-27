import { Module } from '@nestjs/common'
import { MarkNotificationNotifiedService } from '../../application/use-cases/mark-notification-notified/mark-notification-notified.service'
import { MarkNotificationNotifiedUseCase } from '../../application/use-cases/mark-notification-notified/mark-notification-notified.use-case'
import { PrismaModule } from '../../infrastructure/prisma/prisma.module'

@Module({
	imports: [PrismaModule],
	providers: [
		{
			provide: MarkNotificationNotifiedUseCase,
			useClass: MarkNotificationNotifiedService,
		},
	],
	exports: [MarkNotificationNotifiedUseCase],
})
export class MarkNotificationNotifiedModule {}
