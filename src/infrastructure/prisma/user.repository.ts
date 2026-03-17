import { Injectable } from '@nestjs/common'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { User } from 'src/domain/entities/user'
import { TelegramId, toTelegramId } from 'src/domain/value-objects/telegram-id'
import { getAddress, type Address } from 'viem'
import { PrismaService } from './prisma.service'

type UserWithWallet = {
	id: bigint
	telegramId: bigint
	createdAt: Date
	wallet: {
		address: string
	} | null
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
	constructor(private readonly prisma: PrismaService) {}

	async findByTelegramId(telegramId: TelegramId): Promise<User | null> {
		const record = await this.prisma.user.findUnique({
			where: { telegramId },
			include: { wallet: true },
		})

		if (!record || !record.wallet) return null

		return toDomainUser(record as UserWithWallet)
	}

	async create(
		telegramId: TelegramId,
		address: Address,
		kmsKeyId: string,
	): Promise<User> {
		const record = await this.prisma.user.create({
			data: {
				telegramId,
				wallet: {
					create: { address, kmsKeyId },
				},
			},
			include: { wallet: true },
		})

		return toDomainUser(record as UserWithWallet)
	}
}

function toDomainUser(record: UserWithWallet): User {
	return {
		id: record.id,
		telegramId: toTelegramId(record.telegramId),
		evmAddress: getAddress(record.wallet!.address),
		createdAt: record.createdAt,
	}
}
