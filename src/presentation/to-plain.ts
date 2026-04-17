import { Currency } from '../domain/entities/currency'
import { ChainAddress } from '../domain/value-objects/chain-address'
import { CurrencyAmount } from '../domain/value-objects/currency-amount'
import { Transaction } from '../domain/value-objects/transaction'

export type PlainChainAddress = {
	address: string
	chain: {
		reference: string
		namespace: string
	}
}
export function toPlainChainAddress(
	chainAddress: ChainAddress,
): PlainChainAddress {
	return {
		address: chainAddress.address,
		chain: {
			reference: chainAddress.chain.reference,
			namespace: chainAddress.chain.namespace,
		},
	}
}

export type PlainCurrency = {
	chainAddress: PlainChainAddress
	symbol: string
	name: string
	decimals: number
}
export function toPlainCurrency(currency: Currency): PlainCurrency {
	return {
		chainAddress: toPlainChainAddress(currency.chainAddress),
		symbol: currency.symbol,
		name: currency.name,
		decimals: currency.decimals,
	}
}

export type PlainCurrencyAmount = {
	currency: PlainCurrency
	amount: string
}
export function toPlainCurrencyAmount(
	currencyAmount: CurrencyAmount,
): PlainCurrencyAmount {
	return {
		currency: toPlainCurrency(currencyAmount.currency),
		amount: currencyAmount.amount.toString(),
	}
}

export type PlainTransaction = {
	id: string
	cost?: PlainCurrencyAmount
}
export function toPlainTransaction(tx: Transaction): PlainTransaction {
	return {
		id: tx.id,
		cost:
			tx.cost !== undefined ? toPlainCurrencyAmount(tx.cost) : undefined,
	}
}
