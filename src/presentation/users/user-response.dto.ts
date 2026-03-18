import { User } from 'src/domain/entities/user'

export type UserResponseDto = {
	id: string
	telegramId: string
	evmAddress: string
	createdAt: string
}

export function toUserResponseDto(user: User): UserResponseDto {
	return {
		id: user.id.toString(),
		telegramId: user.telegramId.toString(),
		evmAddress: user.evmWallet.address,
		createdAt: user.createdAt.toISOString(),
	}
}
