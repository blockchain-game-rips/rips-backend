import { Module } from '@nestjs/common'
import { NotificationsController } from '../../../presentation/notifications/notifications.controller'
import { GetNotificationsModule } from '../../use-cases/get-notifications.module'
import { MarkNotificationNotifiedModule } from '../../use-cases/mark-notification-notified.module'

@Module({
	imports: [GetNotificationsModule, MarkNotificationNotifiedModule],
	controllers: [NotificationsController],
})
export class NotificationsApiModule {}
