import { AddressesActions } from '../value-objects/actions'
import { Currency } from './currency'
import { Stake } from './stake'

export enum RoundStatus {
	FILLING = 'FILLING',
	SEALED = 'SEALED',
	VRFREQUESTED = 'VRFREQUESTED',
	CLAIMING = 'CLAIMING',
	CLAIMED = 'CLAIMED',
	REFUNDING = 'REFUNDING',
	REFUNDED = 'REFUNDED',
}

export type Round = {
	id: number
	stake: Stake
	currency: Currency
	actions: AddressesActions
	status: RoundStatus
	startTime: Date
	randoms?: { a: bigint; b: bigint }
}

export type OngoingStatus =
	| RoundStatus.FILLING
	| RoundStatus.SEALED
	| RoundStatus.VRFREQUESTED
	| RoundStatus.CLAIMING
	| RoundStatus.REFUNDING

export type OngoingRound = Round & { status: OngoingStatus }

export type CompletedStatus = RoundStatus.CLAIMED | RoundStatus.REFUNDED

export type CompletedRound = Round & { status: CompletedStatus }
