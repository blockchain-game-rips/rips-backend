import { Injectable } from '@nestjs/common'
import { WalletReadService } from '../../application/interfaces/wallet-read.service'
import { Currency } from '../../domain/entities/currency'
import { evmAddressFromWallet } from '../../domain/services/evm'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmCurrencyReadService } from '../evm/evm-currency-read.service'
import { EvmCurrency } from '../evm/primitives/currencies/evm-currency'

@Injectable()
export class WalletReadServiceImpl extends WalletReadService {
	constructor(
		private readonly evmCurrencyReadService: EvmCurrencyReadService,
	) {
		super()
	}

	balanceOf(wallet: Wallet, currency: Currency): Promise<bigint> {
		if (currency instanceof EvmCurrency) {
			const userAddress = evmAddressFromWallet(wallet)

			return this.evmCurrencyReadService.balanceOf(currency, userAddress)
		}

		throw new Error(`Unsupported currency: ${currency.id}`)
	}
}
