import { Injectable } from '@nestjs/common'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { User } from 'src/domain/entities/user'
import { TelegramId, toTelegramId } from 'src/domain/value-objects/telegram-id'
import { getAddress, type Address } from 'viem'
import { Prisma } from '../../../generated/prisma'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaUserRepository extends UserRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async findByTelegramId(telegramId: TelegramId): Promise<User | null> {
		const record = await this.prisma.user.findUnique({
			where: { telegramId },
			include: { evmWallet: true },
		})

		if (!record) return null

		return toDomainUser(record)
	}

	async create(
		telegramId: TelegramId,
		address: Address,
		kmsKeyId: string,
	): Promise<User> {
		const record = await this.prisma.$transaction(async (tx) => {
			const evmWallet = await tx.evmWallet.create({
				data: { address, kmsKeyId },
			})

			return tx.user.create({
				data: { telegramId, evmWalletId: evmWallet.id },
				include: { evmWallet: true },
			})
		})

		return toDomainUser(record)
	}
}

type UserRecord = Prisma.UserGetPayload<{ include: { evmWallet: true } }>

function toDomainUser(record: UserRecord): User {
	return {
		id: record.id,
		telegramId: toTelegramId(record.telegramId),
		evmAddress: getAddress(record.evmWallet.address),
		createdAt: record.createdAt,
	}
}
