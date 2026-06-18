import { Injectable } from '@nestjs/common'
import { Prisma } from '../../../generated/prisma'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { EIP155 } from '../../constants'
import { Executor } from '../../domain/entities/executor'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../domain/value-objects/kms-key-id'
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

	async create(address: EvmAddress, kmsKeyId: KmsKeyId): Promise<Executor> {
		const record = await this.prisma.executor.create({
			data: {
				executorWallet: { create: { address, kmsKeyId } },
			},
			include: { executorWallet: true },
		})

		return toExecutor(
			record as ExecutorRecord & {
				executorWallet: NonNullable<ExecutorRecord['executorWallet']>
			},
		)
	}
}

type ExecutorRecord = Prisma.ExecutorGetPayload<{
	include: { executorWallet: true }
}>

function toExecutor(
	record: ExecutorRecord & {
		executorWallet: NonNullable<ExecutorRecord['executorWallet']>
	},
): Executor {
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
