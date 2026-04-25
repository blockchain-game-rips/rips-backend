import { CurrencyAmount } from '../value-objects/currency-amount'
import { EvmAddress } from '../value-objects/evm-address'

export type ReferrerState = {
	defaultFeePercent: number
	activeFeePercent: number
	customFeePercent: number
	monthStartTime: Date
	currMonthVolume: CurrencyAmount
}

export type ReferrerWithStates = {
	referrer: EvmAddress
	states: ReferrerState[]
	rewards: {
		availableToWithdraw: CurrencyAmount[]
		withdrawnRewards: CurrencyAmount[]
	}
}
