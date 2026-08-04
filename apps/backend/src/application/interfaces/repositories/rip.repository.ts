import {
	FinishedRip,
	OngoingRip,
	Rip,
	SettlingRip,
} from '../../../domain/entities/rip'
import { EvmAddress } from '../../../domain/value-objects/evm-address'

export type FinishedCursor = {
	syncedAt: Date
	ripId: number
}

/**
 * Narrows the finished feed. An omitted userAddress applies no constraint;
 * when given, only rips that address bought entries in are returned.
 */
export type GetFinishedRipsArgs = {
	limit: number
	cursor?: FinishedCursor
	userAddress?: EvmAddress
}

export type FinishedPage = {
	rips: FinishedRip[]
	nextCursor: FinishedCursor | null
}

export abstract class RipRepository {
	abstract getRipsByIds(ids: Set<number>): Promise<Rip[]>

	abstract getOngoingRips(): Promise<OngoingRip[]>

	abstract getFinishedRips(args: GetFinishedRipsArgs): Promise<FinishedPage>

	abstract getNextSettlingRip(afterRipId: number): Promise<SettlingRip | null>
}
