import { AddressesActions } from '../value-objects/actions'
import { Config } from './config'
import { Currency } from './currency'
import { Preset } from './preset'

export enum RipStatus {
	FILLING = 'FILLING',
	SEALED = 'SEALED',
	VRF_REQUESTED = 'VRF_REQUESTED',
	CLAIMING = 'CLAIMING',
	CLAIM_SETTLING = 'CLAIM_SETTLING',
	CLAIMED = 'CLAIMED',
	REFUNDING = 'REFUNDING',
	REFUND_SETTLING = 'REFUND_SETTLING',
	REFUNDED = 'REFUNDED',
}

export type RandomnessFulfillment = {
	randoms: { a: bigint; b: bigint }
	blockNumber: bigint
	logIndex: number
}

export type Rip = {
	id: number
	preset: Preset
	config: Config
	currency: Currency
	actions: AddressesActions
	status: RipStatus
	startTime: Date

	fulfillment?: RandomnessFulfillment
}

export type OngoingStatus =
	| RipStatus.FILLING
	| RipStatus.SEALED
	| RipStatus.VRF_REQUESTED
	| RipStatus.CLAIMING
	| RipStatus.CLAIM_SETTLING
	| RipStatus.REFUNDING
	| RipStatus.REFUND_SETTLING

export type OngoingRip = Rip & { status: OngoingStatus }

export type SettlingStatus =
	| RipStatus.CLAIM_SETTLING
	| RipStatus.REFUND_SETTLING

export type SettlingRip = Rip & { status: SettlingStatus }

export type FinishedStatus = RipStatus.CLAIMED | RipStatus.REFUNDED

export type FinishedRip = Rip & { status: FinishedStatus }

export const FINISHED_STATUSES: readonly RipStatus[] = [
	RipStatus.CLAIMED,
	RipStatus.REFUNDED,
]

export const SETTLING_STATUSES: readonly RipStatus[] = [
	RipStatus.CLAIM_SETTLING,
	RipStatus.REFUND_SETTLING,
]

export const ONGOING_STATUSES: readonly RipStatus[] = [
	RipStatus.FILLING,
	RipStatus.SEALED,
	RipStatus.VRF_REQUESTED,
	RipStatus.CLAIMING,
	RipStatus.CLAIM_SETTLING,
	RipStatus.REFUNDING,
	RipStatus.REFUND_SETTLING,
]

const finishedStatusSet: ReadonlySet<RipStatus> = new Set(FINISHED_STATUSES)

const settlingStatusSet: ReadonlySet<RipStatus> = new Set(SETTLING_STATUSES)

const ongoingStatusSet: ReadonlySet<RipStatus> = new Set(ONGOING_STATUSES)

export function isFinishedRip(rip: Rip): rip is FinishedRip {
	return finishedStatusSet.has(rip.status)
}

export function isSettlingRip(rip: Rip): rip is SettlingRip {
	return settlingStatusSet.has(rip.status)
}

export function isOngoingRip(rip: Rip): rip is OngoingRip {
	return ongoingStatusSet.has(rip.status)
}
