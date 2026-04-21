import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { User } from '../../domain/entities/user'

const UserResponseZ = z.object({
	id: z.string(),
	telegramId: z.string(),
	wallets: z.record(z.string(), z.string()),
	createdAt: z.string(),
})

export class UserResponseDto extends createZodDto(UserResponseZ) {}

export function toUserResponseDto(user: User): UserResponseDto {
	return {
		id: user.id.toString(),
		telegramId: user.telegramProfile.telegramId.toString(),
		wallets: user.wallet.namespaceToAddress,
		createdAt: user.createdAt.toISOString(),
	}
}
