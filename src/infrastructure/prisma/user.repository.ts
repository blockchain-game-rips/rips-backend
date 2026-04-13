import { Injectable } from '@nestjs/common'
import { UserRepository } from 'src/application/interfaces/repositories/user.repository'
import { EIP155 } from 'src/constants'
import { User } from 'src/domain/entities/user'
import { KmsKeyId } from 'src/domain/value-objects/kms-key-id'
import { TelegramId, toTelegramId } from 'src/domain/value-objects/telegram-id'
import { Prisma } from 'src/generated/prisma'
import { getAddress, type Address } from 'viem'
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

	async findByEvmAddress(address: Address): Promise<User | null> {
		const record = await this.prisma.user.findFirst({
			where: { evmWallet: { address } },
			include: { evmWallet: true },
		})

		if (!record) return null

		return toDomainUser(record)
	}

	async create(
		telegramId: TelegramId,
		address: Address,
		kmsKeyId: KmsKeyId,
	): Promise<User> {
		const record = await this.prisma.user.create({
			data: {
				telegramId,
				evmWallet: { create: { address, kmsKeyId } },
			},
			include: { evmWallet: true },
		})

		return toDomainUser(record)
	}

	async setReferrer(userId: bigint, referrerAddress: string): Promise<User> {
		const record = await this.prisma.user.update({
			where: { id: userId },
			data: { referrerAddress },
			include: { evmWallet: true },
		})

		return toDomainUser(record)
	}
}

type UserRecord = Prisma.UserGetPayload<{ include: { evmWallet: true } }>

function toDomainUser(record: UserRecord): User {
	if (!record.evmWallet) {
		throw new Error(`User ${record.id} has no evmWallet`)
	}

	return {
		id: record.id,
		telegramProfile: {
			telegramId: toTelegramId(record.telegramId),
		},
		wallet: {
			kind: 'user',
			namespaceToAddress: {
				[EIP155]: getAddress(record.evmWallet.address),
			},
		},
		referrerAddress: record.referrerAddress,
		createdAt: record.createdAt,
	}
}
