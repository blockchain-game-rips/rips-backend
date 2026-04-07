import { Config } from '../entities/config'
import { Round } from '../entities/round'
import { Stake } from '../entities/stake'

export type AvailableStake =
	| { stake: Stake & { currentConfig: Config }; activeRound: null }
	| { stake: Stake; activeRound: Round }
