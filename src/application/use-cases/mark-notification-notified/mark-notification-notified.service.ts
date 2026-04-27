import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../interfaces/repositories/notification.repository'
import {
	MarkNotificationNotifiedInput,
	MarkNotificationNotifiedUseCase,
} from './mark-notification-notified.use-case'

@Injectable()
export class MarkNotificationNotifiedService extends MarkNotificationNotifiedUseCase {
	constructor(private readonly notificationRepository: NotificationRepository) {
		super()
	}

	execute(input: MarkNotificationNotifiedInput) {
		return this.notificationRepository.setNotified(input.id)
	}
}
