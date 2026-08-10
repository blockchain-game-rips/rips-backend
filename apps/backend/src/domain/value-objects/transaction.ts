import { Chain } from './chain'
import { CurrencyAmount } from './currency-amount'
import { EvmAddress } from './evm-address'

export type Transaction = {
	chain: Chain
	id: string
	senderAddress: EvmAddress
	cost: CurrencyAmount
}

export type TransactionQuote = {
	blockchainFee: CurrencyAmount
}
