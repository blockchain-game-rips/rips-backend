import { AddressesActions } from '../value-objects/actions'
import { Config } from './config'
import { Currency } from './currency'
import { Preset } from './preset'

export enum RipStatus {
	FILLING = 'FILLING',
	SEALED = 'SEALED',
	VRF_REQUESTED = 'VRF_REQUESTED',
	CLAIMING = 'CLAIMING',
	CLAIMED = 'CLAIMED',
	REFUNDING = 'REFUNDING',
	REFUNDED = 'REFUNDED',
}

export type Rip = {
	id: number
	preset: Preset
	config: Config
	currency: Currency
	actions: AddressesActions
	status: RipStatus
	startTime: Date
	randoms?: { a: bigint; b: bigint }
}

export type OngoingStatus =
	| RipStatus.FILLING
	| RipStatus.SEALED
	| RipStatus.VRF_REQUESTED
	| RipStatus.CLAIMING
	| RipStatus.REFUNDING

export type OngoingRip = Rip & { status: OngoingStatus }

export type CompletedStatus = RipStatus.CLAIMED | RipStatus.REFUNDED

export type CompletedRip = Rip & { status: CompletedStatus }

export const COMPLETED_STATUSES: readonly RipStatus[] = [
	RipStatus.CLAIMED,
	RipStatus.REFUNDED,
]

export const ONGOING_STATUSES: readonly RipStatus[] = [
	RipStatus.FILLING,
	RipStatus.SEALED,
	RipStatus.VRF_REQUESTED,
	RipStatus.CLAIMING,
	RipStatus.REFUNDING,
]

const completedStatusSet: ReadonlySet<RipStatus> = new Set(COMPLETED_STATUSES)

const ongoingStatusSet: ReadonlySet<RipStatus> = new Set(ONGOING_STATUSES)

export function isCompletedRip(rip: Rip): rip is CompletedRip {
	return completedStatusSet.has(rip.status)
}

export function isOngoingRip(rip: Rip): rip is OngoingRip {
	return ongoingStatusSet.has(rip.status)
}
