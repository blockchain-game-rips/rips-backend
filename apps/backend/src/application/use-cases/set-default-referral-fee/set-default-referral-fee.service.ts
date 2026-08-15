import { Injectable } from '@nestjs/common'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { TransactionAttempt } from '../../../domain/value-objects/transaction-attempt'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { RipsAdminService } from '../../interfaces/rips-admin.service'
import { SetDefaultReferralFeeUseCase } from './set-default-referral-fee.use-case'

@Injectable()
export class SetDefaultReferralFeeService extends SetDefaultReferralFeeUseCase {
	constructor(
		private readonly ripsAdminService: RipsAdminService,
		private readonly adminWalletRepository: AdminWalletRepository,
	) {
		super()
	}

	async execute(input: { feeBps: number }): Promise<TransactionAttempt> {
		const adminWallet = await this.adminWalletRepository.get()

		if (!adminWallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		return this.ripsAdminService.setDefaultReferralFee(adminWallet, input)
	}
}
