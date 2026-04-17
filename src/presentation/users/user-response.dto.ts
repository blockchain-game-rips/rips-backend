import { User } from '../../domain/entities/user'
import { ChainNamespace } from '../../domain/value-objects/chain-namespace'

export type UserResponseDto = {
	id: string
	telegramId: string
	wallets: Record<ChainNamespace, string>
	createdAt: string
}

export function toUserResponseDto(user: User): UserResponseDto {
	return {
		id: user.id.toString(),
		telegramId: user.telegramProfile.telegramId.toString(),
		wallets: user.wallet.namespaceToAddress,
		createdAt: user.createdAt.toISOString(),
	}
}
