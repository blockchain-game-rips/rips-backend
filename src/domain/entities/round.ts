import { Stake } from './stake'

export enum RoundStatus {
	FILLING,
	SEALED,
	VRFREQUESTED,
	CLAIMING,
	CLAIMED,
	REFUNDING,
	REFUNDED,
}

export type Round = {
	id: number
	stake: Stake
	// status: RoundStatus
}
