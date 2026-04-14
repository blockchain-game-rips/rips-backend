import { User } from '../../domain/entities/user'
import { ChainNamespace } from '../../domain/value-objects/chain-namespace'

export type UserResponseDto = {
	id: string
	wallets: Record<ChainNamespace, string>
	createdAt: string
}

export function toUserResponseDto(user: User): UserResponseDto {
	return {
		id: user.id.toString(),
		wallets: user.wallet.namespaceToAddress,
		createdAt: user.createdAt.toISOString(),
	}
}
