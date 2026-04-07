import { Config } from '../entities/config'
import { OngoingRound } from '../entities/round'
import { Stake } from '../entities/stake'

export type AvailableStake =
	| { stake: Stake & { currentConfig: Config }; fillingRound: null }
	| { stake: Stake; fillingRound: OngoingRound }
