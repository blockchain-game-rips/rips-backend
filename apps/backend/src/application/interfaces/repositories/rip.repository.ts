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

/**
 * How many finished rips an address took part in, split by outcome. Counts
 * distinct rips, so buying several entries in one rip still counts once.
 */
export type FinishedRipCounts = {
	claimed: number
	refunded: number
}

export abstract class RipRepository {
	abstract getRipsByIds(ids: Set<number>): Promise<Rip[]>

	abstract getOngoingRips(): Promise<OngoingRip[]>

	abstract getFinishedRips(args: GetFinishedRipsArgs): Promise<FinishedPage>

	abstract countFinishedRips(
		userAddress: EvmAddress,
	): Promise<FinishedRipCounts>

	abstract getNextSettlingRip(afterRipId: number): Promise<SettlingRip | null>
}
