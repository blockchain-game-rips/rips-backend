import { Injectable } from '@nestjs/common'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { Transaction } from '../../../domain/value-objects/transaction'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { RipsAdminService } from '../../interfaces/rips-admin.service'
import { SetReferrerCustomFeeUseCase } from './set-referrer-custom-fee.use-case'

@Injectable()
export class SetReferrerCustomFeeService extends SetReferrerCustomFeeUseCase {
	constructor(
		private readonly ripsAdminService: RipsAdminService,
		private readonly adminWalletRepository: AdminWalletRepository,
	) {
		super()
	}

	async execute(input: {
		referrer: EvmAddress
		feeBps: number
	}): Promise<Transaction> {
		const adminWallet = await this.adminWalletRepository.get()

		if (!adminWallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		return this.ripsAdminService.setReferrerCustomFee(adminWallet, input)
	}
}
