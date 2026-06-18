import { Injectable, Logger } from '@nestjs/common'
import { KmsService } from '../../application/interfaces/kms.service'
import { AdminWalletRepository } from '../../application/interfaces/repositories/admin-wallet.repository'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { Executor } from '../../domain/entities/executor'
import { EvmAddress } from '../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../domain/value-objects/kms-key-id'
import { AdminWallet } from '../../domain/value-objects/wallet'

@Injectable()
export class ProvisionService {
	private readonly logger = new Logger(ProvisionService.name)

	constructor(
		private readonly kmsService: KmsService,
		private readonly executorRepository: ExecutorRepository,
		private readonly adminWalletRepository: AdminWalletRepository,
	) {}

	async seedAdminWallet(
		address: EvmAddress,
		kmsKeyId: KmsKeyId,
	): Promise<AdminWallet> {
		const adminWallet = await this.adminWalletRepository.upsert(
			address,
			kmsKeyId,
		)

		this.logger.log(`Admin wallet seeded with address ${address}`)

		return adminWallet
	}

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

			const executor = await this.executorRepository.create(
				evmAddress,
				kmsKeyId,
			)

			createdExecutors.push(executor)

			this.logger.log(
				`Created executor ${executor.id} with address ${evmAddress}`,
			)
		}

		return [...existing, ...createdExecutors]
	}
}
