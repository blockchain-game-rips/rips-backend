import { Injectable } from '@nestjs/common'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { EvmAddress } from '../../../domain/value-objects/evm-address'
import { Transaction } from '../../../domain/value-objects/transaction'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { RipsAdminService } from '../../interfaces/rips-admin.service'
import { SetReferrerFrozenUseCase } from './set-referrer-frozen.use-case'

@Injectable()
export class SetReferrerFrozenService extends SetReferrerFrozenUseCase {
	constructor(
		private readonly ripsAdminService: RipsAdminService,
		private readonly adminWalletRepository: AdminWalletRepository,
	) {
		super()
	}

	async execute(input: {
		referrer: EvmAddress
		frozen: boolean
	}): Promise<Transaction> {
		const adminWallet = await this.adminWalletRepository.get()

		if (!adminWallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		return this.ripsAdminService.setReferrerFrozen(adminWallet, input)
	}
}
