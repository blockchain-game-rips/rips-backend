import { EvmAddress } from '../value-objects/evm-address'
import { Currency } from './currency'

export type ReferrerState = {
	currency: Currency
	fee: number
	volume: {
		monthStart: Date | null
		currentMonth: bigint
	}
	rewards: {
		available: bigint
		withdrawn: bigint
	}
}

export type Referrer = {
	address: EvmAddress
	states: ReferrerState[]
}
