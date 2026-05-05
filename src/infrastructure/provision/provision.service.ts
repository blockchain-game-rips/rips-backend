import { Injectable, Logger } from '@nestjs/common'
import { KmsService } from '../../application/interfaces/kms.service'
import { AdminWalletRepository } from '../../application/interfaces/repositories/admin-wallet.repository'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { Executor } from '../../domain/entities/executor'
import { AdminWallet } from '../../domain/value-objects/wallet'

@Injectable()
export class ProvisionService {
	private readonly logger = new Logger(ProvisionService.name)

	constructor(
		private readonly kmsService: KmsService,
		private readonly executorRepository: ExecutorRepository,
		private readonly adminWalletRepository: AdminWalletRepository,
	) {}

	async ensureAdminWallet(): Promise<AdminWallet> {
		const existing = await this.adminWalletRepository.get()

		if (existing) {
			this.logger.log(`Admin wallet already provisioned`)
			return existing
		}

		const { kmsKeyId, evmAddress } = await this.kmsService.createEvmKey()
		const adminWallet = await this.adminWalletRepository.upsert(
			evmAddress,
			kmsKeyId,
		)

		this.logger.log(`Created admin wallet with address ${evmAddress}`)

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
