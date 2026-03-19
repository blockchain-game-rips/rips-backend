import { ChainAddress } from '../value-objects/chain-address'
import { CurrencyId } from '../value-objects/currency-id'

export interface CurrencyMetadata {
	symbol: string
	name?: string
	decimals: number
}

export type Currency = {
	id: CurrencyId
	account: ChainAddress
} & CurrencyMetadata
