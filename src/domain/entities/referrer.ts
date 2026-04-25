import { EvmAddress } from '../value-objects/evm-address'
import { Currency } from './currency'

export type ReferrerState = {
	currency: Currency
	fees: {
		default: number
		active: number
		custom: number
	}
	volume: {
		monthStart: Date
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
