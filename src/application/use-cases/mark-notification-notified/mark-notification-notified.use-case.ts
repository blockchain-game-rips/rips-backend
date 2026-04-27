import { Notification } from '../../../domain/entities/notification'

export type MarkNotificationNotifiedInput = {
	id: bigint
}

export abstract class MarkNotificationNotifiedUseCase {
	abstract execute(input: MarkNotificationNotifiedInput): Promise<Notification>
}
