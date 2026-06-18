import { Injectable } from '@nestjs/common'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { ReferrerTier } from '../../../domain/value-objects/referral-system'
import { Transaction } from '../../../domain/value-objects/transaction'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { RipsAdminService } from '../../interfaces/rips-admin.service'
import { SetReferralTiersUseCase } from './set-referral-tiers.use-case'

@Injectable()
export class SetReferralTiersService extends SetReferralTiersUseCase {
	constructor(
		private readonly ripsAdminService: RipsAdminService,
		private readonly adminWalletRepository: AdminWalletRepository,
	) {
		super()
	}

	async execute(input: {
		currencyAddress: EvmAddress
		tiers: ReferrerTier[]
	}): Promise<Transaction> {
		const adminWallet = await this.adminWalletRepository.get()

		if (!adminWallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		return this.ripsAdminService.setReferralTiers(adminWallet, input)
	}
}
