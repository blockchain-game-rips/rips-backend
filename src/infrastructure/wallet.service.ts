import { Injectable } from '@nestjs/common'
import { WalletService } from 'src/application/interfaces/wallet.service'
import { EIP155 } from 'src/constants'
import { Currency } from 'src/domain/entities/currency'
import { ChainAddress } from 'src/domain/value-objects/chain-address'
import { Transaction } from 'src/domain/value-objects/transaction'
import { Wallet } from 'src/domain/value-objects/wallet'
import { getAddress } from 'viem'
import { EvmCurrency } from './evm/primitives/currencies/currency'

@Injectable()
export class WalletServiceImpl extends WalletService {
	balanceOf(wallet: Wallet, currency: Currency): Promise<bigint> {
		if (currency instanceof EvmCurrency) {
			const userAddress = getAddress(wallet.namespaceToAddress[EIP155])

			const balance = currency.balanceOf(userAddress)

			return balance
		}

		throw new Error(`Unsupported currency: ${currency.id}`)
	}

	// TODO: implement
	transfer(
		wallet: Wallet,
		args: {
			currency: Currency
			from: ChainAddress
			to: ChainAddress
		},
	): Promise<Transaction> {
		throw new Error('Not implemented')
	}
}
