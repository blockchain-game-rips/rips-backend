import { Injectable } from '@nestjs/common'
import * as chains from 'viem/chains'
import { EIP155 } from '../../../constants'
import { AdminWalletNotFoundError } from '../../../domain/errors/admin-wallet-not-found.error'
import { CurrencyAmount } from '../../../domain/value-objects/currency-amount'
import { CurrencyService } from '../../interfaces/currency.service'
import { AdminWalletRepository } from '../../interfaces/repositories/admin-wallet.repository'
import { WalletReadService } from '../../interfaces/wallet-read.service'
import {
	GetAdminWalletResult,
	GetAdminWalletUseCase,
} from './get-admin-wallet.use-case'

const BASE_ETH_CHAIN_ADDRESS = {
	chain: {
		namespace: EIP155,
		reference: chains.base.id.toString(),
	},
	address: '0x0000000000000000000000000000000000000000',
}

@Injectable()
export class GetAdminWalletService extends GetAdminWalletUseCase {
	constructor(
		private readonly adminWalletRepository: AdminWalletRepository,
		private readonly currencyService: CurrencyService,
		private readonly walletReadService: WalletReadService,
	) {
		super()
	}

	async execute(): Promise<GetAdminWalletResult> {
		const wallet = await this.adminWalletRepository.get()

		if (!wallet) {
			throw new AdminWalletNotFoundError('Admin wallet not provisioned')
		}

		const currency = await this.currencyService.fromAccount(
			BASE_ETH_CHAIN_ADDRESS,
		)
		const amount = await this.walletReadService.balanceOf(wallet, currency)
		const balance: CurrencyAmount = { currency, amount }

		return { wallet, balance }
	}
}
