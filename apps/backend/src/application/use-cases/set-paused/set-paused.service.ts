import { Injectable } from '@nestjs/common'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { RipsAdminService } from '../../interfaces/rips-admin.service'
import { SetPausedUseCase } from './set-paused.use-case'

@Injectable()
export class SetPausedService extends SetPausedUseCase {
	constructor(
		private readonly ripsAdminService: RipsAdminService,
		private readonly adminWalletRepository: AdminWalletRepository,
	) {
		super()
	}

	async execute(input: { isPaused: boolean }): Promise<TransactionAttempt> {
		const adminWallet = await this.adminWalletRepository.get()

		if (!adminWallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		return input.isPaused
			? this.ripsAdminService.pause(adminWallet)
			: this.ripsAdminService.unpause(adminWallet)
	}
}
