import { AddressesActions } from '../value-objects/actions'
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
	actions: AddressesActions
	status: RoundStatus
	randoms?: { a: bigint; b: bigint }
}
