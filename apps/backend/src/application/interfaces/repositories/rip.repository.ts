import {
	FinishedRip,
	OngoingRip,
	Rip,
	SettlingRip,
} from '../../../domain/entities/rip'

export type FinishedCursor = {
	syncedAt: Date
	ripId: number
}

export type GetFinishedRipsArgs = {
	limit: number
	cursor?: FinishedCursor
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
