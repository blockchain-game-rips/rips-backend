import { Injectable } from '@nestjs/common'
import { NotificationRepository } from '../../interfaces/repositories/notification.repository'
import { GetNotificationsUseCase } from './get-notifications.use-case'

@Injectable()
export class GetNotificationsService extends GetNotificationsUseCase {
	constructor(
		private readonly notificationRepository: NotificationRepository,
	) {
		super()
	}

	execute() {
		return this.notificationRepository.findAll()
	}
}
