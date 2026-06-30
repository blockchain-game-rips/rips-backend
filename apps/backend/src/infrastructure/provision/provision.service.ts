import { Injectable, Logger } from '@nestjs/common'
import { KmsService } from '../../application/interfaces/kms.service'
import { AdminWalletRepository } from '../../application/interfaces/repositories/admin-wallet.repository'
import { ExecutorRepository } from '../../application/interfaces/repositories/executor.repository'
import { RipsAdminService } from '../../application/interfaces/rips-admin.service'
import { Executor } from '../../domain/entities/executor'
import {
	EvmAddress,
	toEvmAddress,
} from '../../domain/value-objects/evm-address'
import { KmsKeyId } from '../../domain/value-objects/kms-key-id'
import { AdminWallet } from '../../domain/value-objects/wallet'
import { evmAddressFromWallet } from '../evm/helpers'

@Injectable()
export class ProvisionService {
	private readonly logger = new Logger(ProvisionService.name)

	constructor(
		private readonly kmsService: KmsService,
		private readonly executorRepository: ExecutorRepository,
		private readonly adminWalletRepository: AdminWalletRepository,
		private readonly ripsAdminService: RipsAdminService,
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

	async grantExecutorRoles(executors: Executor[]): Promise<void> {
		const adminWallet = await this.adminWalletRepository.get()

		if (!adminWallet) {
			throw new Error(
				'Admin wallet not provisioned. Seed it before granting executor roles.',
			)
		}

		for (const executor of executors) {
			const operator = toEvmAddress(evmAddressFromWallet(executor.wallet))

			await this.ripsAdminService.grantOperatorRole(adminWallet, {
				operator,
			})

			this.logger.log(`Granted OPERATOR_ROLE to executor ${operator}`)
		}
	}
}
