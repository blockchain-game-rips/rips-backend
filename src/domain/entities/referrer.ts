import { EvmAddress } from '../value-objects/evm-address'
import { Currency } from './currency'

export type ReferrerState = {
	currency: Currency
	fee: number
	period: {
		startTime: Date | null
		volume: bigint
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
