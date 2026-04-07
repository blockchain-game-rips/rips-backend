import { OngoingRound } from '../entities/round'
import { Stake } from '../entities/stake'

export type StakeWithRounds = {
	stake: Stake
	ongoingRounds: OngoingRound[]
}
