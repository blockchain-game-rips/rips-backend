import { Injectable } from '@nestjs/common'
import { ExecutorRepository } from 'src/application/interfaces/repositories/executor.repository'
import { EIP155 } from 'src/constants'
import { Executor } from 'src/domain/entities/executor'
import { Prisma } from 'src/generated/prisma'
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

		return records
			.filter((r) => r.executorWallet !== null)
			.map(toExecutor)
	}
}

type ExecutorRecord = Prisma.ExecutorGetPayload<{ include: { executorWallet: true } }>

function toExecutor(record: ExecutorRecord & { executorWallet: NonNullable<ExecutorRecord['executorWallet']> }): Executor {
	return {
		id: record.id,
		wallet: {
			namespaceToAddress: {
				[EIP155]: record.executorWallet.address,
			},
		},
	}
}
