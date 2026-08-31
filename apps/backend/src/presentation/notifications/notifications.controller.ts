import { Controller, Get, Param, Patch } from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { GetNotificationsUseCase } from '../../application/use-cases/get-notifications/get-notifications.use-case'
import { MarkNotificationNotifiedUseCase } from '../../application/use-cases/mark-notification-notified/mark-notification-notified.use-case'
import { PublicAccess } from '../shared/access/access-level'
import {
	GetNotificationsResponseDto,
	toGetNotificationsResponseDto,
} from './get-notifications/get-notifications.response'
import {
	MarkNotificationNotifiedParamsDto,
	NOTIFICATION_ID_PARAM,
} from './mark-notification-notified/mark-notification-notified.request'
import {
	MarkNotificationNotifiedResponseDto,
	toMarkNotificationNotifiedResponseDto,
} from './mark-notification-notified/mark-notification-notified.response'

@Controller('notifications')
@PublicAccess()
export class NotificationsController {
	constructor(
		private readonly getNotificationsUseCase: GetNotificationsUseCase,
		private readonly markNotificationNotifiedUseCase: MarkNotificationNotifiedUseCase,
	) {}

	@Get()
	@ZodResponse({ type: GetNotificationsResponseDto })
	async getNotifications(): Promise<GetNotificationsResponseDto> {
		const notifications = await this.getNotificationsUseCase.execute()

		return toGetNotificationsResponseDto(notifications)
	}

	@Patch(`:${NOTIFICATION_ID_PARAM}`)
	@ZodResponse({ type: MarkNotificationNotifiedResponseDto })
	async markNotified(
		@Param() params: MarkNotificationNotifiedParamsDto,
	): Promise<MarkNotificationNotifiedResponseDto> {
		const notification = await this.markNotificationNotifiedUseCase.execute(
			{
				id: params.notificationId,
			},
		)

		return toMarkNotificationNotifiedResponseDto(notification)
	}
}
