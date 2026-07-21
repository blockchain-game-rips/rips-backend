import { Injectable } from '@nestjs/common'
import { WalletWriteService } from '../../application/interfaces/wallet-write.service'
import { Currency } from '../../domain/entities/currency'
import { ChainAddress } from '../../domain/value-objects/chain-address'
import {
	Transaction,
	TransactionQuote,
} from '../../domain/value-objects/transaction'
import { Wallet } from '../../domain/value-objects/wallet'
import { EvmCurrencyWriteService } from '../evm/evm-currency-write.service'
import { EvmCurrency } from '../evm/primitives/currencies/evm-currency'

@Injectable()
export class WalletWriteServiceImpl extends WalletWriteService {
	constructor(
		private readonly evmCurrencyWriteService: EvmCurrencyWriteService,
	) {
		super()
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

	quoteTransfer(
		_wallet: Wallet,
		args: {
			currency: Currency
			to: ChainAddress
			amount: bigint
		},
	): Promise<TransactionQuote> {
		if (args.currency instanceof EvmCurrency) {
			return this.evmCurrencyWriteService.quoteTransfer({
				...args,
				currency: args.currency,
			})
		}

		throw new Error(`Unsupported currency: ${args.currency.id}`)
	}
}
