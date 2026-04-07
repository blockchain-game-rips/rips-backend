import { OngoingRound } from '../entities/round'
import { Stake } from '../entities/stake'

export type StakeWithOngoingRounds = {
	stake: Stake
	ongoingRounds: OngoingRound[]
}
