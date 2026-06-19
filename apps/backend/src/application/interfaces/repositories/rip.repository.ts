import { CompletedRip, Rip } from '../../../domain/entities/rip'

export type GetCompletedRipsArgs = {
	limit: number
	cursor?: number
}

export abstract class RipRepository {
	abstract getRipsByIds(ids: Set<number>): Promise<Rip[]>

	abstract getCompletedRips(
		args: GetCompletedRipsArgs,
	): Promise<CompletedRip[]>

	abstract getNextCompletedRip(
		afterRipId: number,
	): Promise<CompletedRip | null>
}
