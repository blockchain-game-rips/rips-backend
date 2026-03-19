import { User } from 'src/domain/entities/user'
import { ChainNamespace } from 'src/domain/value-objects/chain-namespace'

export type UserResponseDto = {
	id: string
	wallets: Record<ChainNamespace, string>
	createdAt: string
}

export function toUserResponseDto(user: User): UserResponseDto {
	return {
		id: user.id.toString(),
		wallets: user.wallets,
		createdAt: user.createdAt.toISOString(),
	}
}
