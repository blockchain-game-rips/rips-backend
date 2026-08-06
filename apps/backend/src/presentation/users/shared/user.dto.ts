import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'
import { User } from '../../../domain/entities/user'

const userSchema = z
	.object({
		id: z.string(),
		telegramId: z.string(),
		wallets: z.record(z.string(), z.string()),
		referrerAddress: z.string().nullable(),
		createdAt: z.string(),
	})
	.meta({ id: 'UserDto' })

export class UserDto extends createZodDto(userSchema) {}

export function toUserDto(user: User): UserDto {
	return {
		id: user.id.toString(),
		telegramId: user.telegramProfile.telegramId.toString(),
		wallets: user.wallet.namespaceToAddress,
		referrerAddress: user.referrerAddress ?? null,
		createdAt: user.createdAt.toISOString(),
	}
}
