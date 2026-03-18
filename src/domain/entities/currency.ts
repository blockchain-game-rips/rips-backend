import { Account } from '../value-objects/account'
import { CurrencyId } from '../value-objects/currency-id'

export interface CurrencyMetadata {
	symbol: string
	name?: string
	decimals: number
}

export type Currency = {
	id: CurrencyId
	account: Account
	balanceOf(address: string): Promise<bigint>
} & CurrencyMetadata
