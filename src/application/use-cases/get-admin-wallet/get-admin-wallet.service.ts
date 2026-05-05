import { Injectable } from '@nestjs/common'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { AdminWallet } from '../../../domain/value-objects/wallet'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { GetAdminWalletUseCase } from './get-admin-wallet.use-case'

@Injectable()
export class GetAdminWalletService extends GetAdminWalletUseCase {
	constructor(private readonly adminWalletRepository: AdminWalletRepository) {
		super()
	}

	async execute(): Promise<AdminWallet> {
		const adminWallet = await this.adminWalletRepository.get()

		if (!adminWallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		return adminWallet
	}
}
