import { Injectable } from '@nestjs/common'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { EIP155 } from 'src/constants'
import { Currency } from 'src/domain/entities/currency'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'
import { getAddress } from 'viem'
import { EvmCurrencyReadService } from '../evm/evm-currency-read.service'
import { EvmCurrencyWriteService } from '../evm/evm-currency-write.service'
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
			const userAddress = getAddress(wallet.namespaceToAddress[EIP155])
			return this.evmCurrencyReadService.balanceOf(currency, userAddress)
		}

		throw new Error(`Unsupported currency: ${currency.id}`)
	}

	transfer(
		wallet: Wallet,
		args: {
			currency: Currency
			from: ChainAddress
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
