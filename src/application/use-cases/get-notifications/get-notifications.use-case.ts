import { Notification } from '../../../domain/entities/notification'

export abstract class GetNotificationsUseCase {
	abstract execute(): Promise<Notification[]>
}
