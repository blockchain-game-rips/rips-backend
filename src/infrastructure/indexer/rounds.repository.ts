import { Inject, Injectable } from '@nestjs/common'
import {
	GetCompletedRoundsArgs,
	RoundRepository,
} from 'src/application/interfaces/repositories/round.repository'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { Currency } from 'src/domain/entities/currency'
import { CompletedRound } from 'src/domain/entities/round'
import { IndexerService } from './indexer.service'
import { fromRoundRaw } from './utils'

@Injectable()
export class IndexerRoundRepository extends RoundRepository {
	constructor(
		private readonly indexer: IndexerService,
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {
		super()
	}

	async getCompletedRounds({
		limit,
		cursor,
	}: GetCompletedRoundsArgs): Promise<CompletedRound[]> {
		const { rounds } = await this.indexer.sdk.GetCompletedRounds({
			limit,
			cursor: cursor?.toString(),
		})

		return rounds.map(
			(r) =>
				fromRoundRaw(r, this.mainCurrency) as unknown as CompletedRound,
		)
	}

	async getNextClaimedRound(
		afterRoundId: number,
	): Promise<CompletedRound | null> {
		// TODO: implement GraphQL query for next claimed round after afterRoundId
		throw new Error('Not implemented')
	}
}
