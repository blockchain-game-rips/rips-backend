import { AddressesActions } from '../value-objects/actions'
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
	actions: AddressesActions
	status: RoundStatus
	randoms?: { a: bigint; b: bigint }
}
