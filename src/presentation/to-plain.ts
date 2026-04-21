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
	priceUsd: number
}
export function toPlainCurrency(
	currency: Currency,
	priceUsd: number,
): PlainCurrency {
	return {
		chainAddress: toPlainChainAddress(currency.chainAddress),
		symbol: currency.symbol,
		name: currency.name,
		decimals: currency.decimals,
		priceUsd,
	}
}

export type PlainCurrencyAmount = {
	currency: PlainCurrency
	amount: string
}
export function toPlainCurrencyAmount(
	currencyAmount: CurrencyAmount,
	priceUsd: number,
): PlainCurrencyAmount {
	return {
		currency: toPlainCurrency(currencyAmount.currency, priceUsd),
		amount: currencyAmount.amount.toString(),
	}
}

export type PlainTransaction = {
	id: string
	cost?: PlainCurrencyAmount
}
export function toPlainTransaction(
	tx: Transaction,
	costPriceUsd?: number,
): PlainTransaction {
	return {
		id: tx.id,
		cost:
			tx.cost !== undefined
				? toPlainCurrencyAmount(tx.cost, costPriceUsd ?? 0)
				: undefined,
	}
}
