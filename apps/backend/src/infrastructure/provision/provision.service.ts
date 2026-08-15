import { Injectable, Logger } from '@nestjs/common'
import { EncryptionService } from '../../application/interfaces/encryption.service'
import { AdminWalletRepository } from '../../application/interfaces/repositories/admin-wallet.repository'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { RipsAdminService } from '../../application/interfaces/rips-admin.service'
import { Executor } from '../../domain/entities/executor'
import {
	createPrivateKey,
	evmAddressFromPrivateKey,
	evmAddressFromWallet,
} from '../../domain/services/evm'
import { PrivateKey } from '../../domain/value-objects/private-key'
import { AdminWallet } from '../../domain/value-objects/wallet'
import { requireSucceeded } from './require-succeeded-transaction'

@Injectable()
export class ProvisionService {
	private readonly logger = new Logger(ProvisionService.name)

	constructor(
		private readonly encryptionService: EncryptionService,
		private readonly executorRepository: ExecutorRepository,
		private readonly adminWalletRepository: AdminWalletRepository,
		private readonly ripsAdminService: RipsAdminService,
	) {}

	async seedAdminWallet(privateKey: PrivateKey): Promise<AdminWallet> {
		const address = evmAddressFromPrivateKey(privateKey)
		const encryptedKey = await this.encryptionService.encrypt(privateKey)

		const adminWallet = await this.adminWalletRepository.upsert(
			address,
			encryptedKey,
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
			const privateKey = createPrivateKey()
			const address = evmAddressFromPrivateKey(privateKey)
			const encryptedKey =
				await this.encryptionService.encrypt(privateKey)

			const executor = await this.executorRepository.create(
				address,
				encryptedKey,
			)

			createdExecutors.push(executor)

			this.logger.log(
				`Created executor ${executor.id} with address ${address}`,
			)
		}

		return [...existing, ...createdExecutors]
	}

	async grantExecutorRoles(executors: Executor[]): Promise<void> {
		const adminWallet = await this.adminWalletRepository.get()

		if (!adminWallet) {
			throw new Error(
				'Admin wallet not provisioned. Seed it before granting executor roles.',
			)
		}

		for (const executor of executors) {
			const operator = evmAddressFromWallet(executor.wallet)

			const attempt = await this.ripsAdminService.grantOperatorRole(
				adminWallet,
				{ operator },
			)

			requireSucceeded(attempt, `Grant OPERATOR_ROLE to ${operator}`)

			this.logger.log(`Granted OPERATOR_ROLE to executor ${operator}`)
		}
	}
}
