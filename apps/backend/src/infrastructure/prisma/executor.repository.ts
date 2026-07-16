import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../generated/prisma'
import { EncryptedKey } from '../../application/interfaces/encryption.service'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { EIP155 } from '../../constants'
import { Executor } from '../../domain/entities/executor'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaExecutorRepository extends ExecutorRepository {
	constructor(private readonly prisma: PrismaService) {
		super()
	}

	async getAll(): Promise<Executor[]> {
		const records = await this.prisma.executor.findMany({
			include: { executorWallet: true },
		})

		return records.filter((r) => r.executorWallet !== null).map(toExecutor)
	}

	async create(
		address: EvmAddress,
		encryptedKey: EncryptedKey,
	): Promise<Executor> {
		const record = await this.prisma.executor.create({
			data: {
				executorWallet: {
					create: {
						address,
						encryptedPrivateKey: encryptedKey.encryptedPrivateKey,
						kekVersion: encryptedKey.kekVersion,
					},
				},
			},
			include: { executorWallet: true },
		})

		return toExecutor(record)
	}
}

type ExecutorRecord = Prisma.ExecutorGetPayload<{
	include: { executorWallet: true }
}>

function toExecutor(record: ExecutorRecord): Executor {
	if (!record.executorWallet) {
		throw new Error(`Executor ${record.id} has no executorWallet`)
	}

	return {
		id: record.id,
		wallet: {
			kind: 'executor',
			namespaceToAddress: {
				[EIP155]: toEvmAddress(record.executorWallet.address),
			},
		},
	}
}
