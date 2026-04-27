import { Notification } from '../../../domain/entities/notification'

export abstract class NotificationRepository {
	abstract findAll(): Promise<Notification[]>

	abstract setNotified(id: bigint): Promise<Notification>
}
