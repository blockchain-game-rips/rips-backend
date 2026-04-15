import { Injectable } from '@nestjs/common'
import { WalletService } from '../../application/interfaces/wallet.service'
import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import { Transaction } from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmCurrencyReadService } from '../evm/evm-currency-read.service'
import { EvmCurrencyWriteService } from '../evm/evm-currency-write.service'
import { evmAddressFromWallet } from '../evm/helpers'
import { EvmCurrency } from '../evm/primitives/currencies/evm-currency'

@Injectable()
export class WalletServiceImpl extends WalletService {
	constructor(
		private readonly evmCurrencyReadService: EvmCurrencyReadService,
		private readonly evmCurrencyWriteService: EvmCurrencyWriteService,
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

	transfer(
		wallet: Wallet,
		args: {
			currency: Currency
			to: ChainAddress
			amount: bigint
		},
	): Promise<Transaction> {
		if (args.currency instanceof EvmCurrency) {
			return this.evmCurrencyWriteService.transfer(wallet, {
				...args,
				currency: args.currency,
			})
		}

		throw new Error(`Unsupported currency: ${args.currency.id}`)
	}
}
