import { Inject, Injectable } from '@nestjs/common'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { MAIN_CURRENCY } from 'src/application/interfaces/tokens'
import { Currency } from 'src/domain/entities/currency'
import { OngoingRound, RoundStatus } from 'src/domain/entities/round'
import { Stake } from 'src/domain/entities/stake'
import { StakeWithOngoingRounds } from 'src/domain/value-objects/stake-with-ongoing-rounds'
import { IndexerService } from './indexer.service'
import { fromConfigRaw, fromRoundRaw, resolveRoundStatus } from './utils'

const ONGOING_STATUSES = new Set([
	RoundStatus.FILLING,
	RoundStatus.SEALED,
	RoundStatus.VRF_REQUESTED,
	RoundStatus.CLAIMING,
	RoundStatus.REFUNDING,
])

@Injectable()
export class IndexerStakeRepository extends StakeRepository {
	constructor(
		private readonly indexer: IndexerService,
		@Inject(MAIN_CURRENCY) private readonly mainCurrency: Currency,
	) {
		super()
	}

	async getStakesWithOngoingRounds(): Promise<StakeWithOngoingRounds[]> {
		const { stakes } = await this.indexer.sdk.GetStakesWithOngoingRounds()

		return stakes.map((stakeRaw) => {
			const currentConfig =
				stakeRaw.configs.length > 0
					? fromConfigRaw(stakeRaw.configs[0], this.mainCurrency)
					: null

			const stake: Stake = {
				id: Number(stakeRaw.id),
				currentConfig: stakeRaw.deleted ? null : currentConfig,
			}

			const ongoingRounds = stakeRaw.rounds
				.filter((r) => {
					const status = resolveRoundStatus(r.status)
					return ONGOING_STATUSES.has(status)
				})
				.map(
					(r) =>
						fromRoundRaw(
							{ ...r, stakeId: stakeRaw.id },
							this.mainCurrency,
						) as OngoingRound,
				)

			return { stake, ongoingRounds }
		})
	}
}
