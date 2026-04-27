enum NotificationType {
	CLAIMED = 'CLAIMED',
	REFUNDED = 'REFUNDED',
}

// userId = 0 represents a group broadcast (no specific user)
export type Notification = {
	id: bigint
	userId: bigint
	roundId: bigint
	type: NotificationType
	createdAt: Date
	isNotified: boolean
}
