export enum NotificationType {
	CLAIMED = 'CLAIMED',
	REFUNDED = 'REFUNDED',
}

// userId = 0 represents a group broadcast (no specific user)
export type Notification = {
	id: bigint
	userTelegramId: bigint
	roundId: bigint
	type: NotificationType
	createdAt: Date
	isNotified: boolean
}
