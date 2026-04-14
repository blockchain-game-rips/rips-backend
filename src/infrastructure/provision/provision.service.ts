import { Injectable, Logger } from '@nestjs/common'
import { getAddress } from 'viem'
import { KmsService } from '../../application/interfaces/kms.service'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { Executor } from '../../domain/entities/executor'

@Injectable()
export class ProvisionService {
	private readonly logger = new Logger(ProvisionService.name)

	constructor(
		private readonly kmsService: KmsService,
		private readonly executorRepository: ExecutorRepository,
	) {}

	async ensureExecutors(count: number): Promise<Executor[]> {
		const existing = await this.executorRepository.getAll()
		const missing = count - existing.length

		if (missing <= 0) {
			this.logger.log(
				`Executors already provisioned (${existing.length}/${count})`,
			)

			return existing
		}

		this.logger.log(`Creating ${missing} executor(s)...`)

		const createdExecutors: Executor[] = []

		for (let i = 0; i < missing; i++) {
			const { kmsKeyId, evmAddress } =
				await this.kmsService.createEvmKey()
			const address = getAddress(evmAddress)

			const executor = await this.executorRepository.create(
				address,
				kmsKeyId,
			)

			createdExecutors.push(executor)

			this.logger.log(
				`Created executor ${executor.id} with address ${address}`,
			)
		}

		return [...existing, ...createdExecutors]
	}
}
