import { Module } from '@nestjs/common'
import { RewardRepository } from '../../src/application/interfaces/repositories/reward.repository'
import { RoundRepository } from '../../src/application/interfaces/repositories/round.repository'
import { StakeRepository } from '../../src/application/interfaces/repositories/stake.repository'
import { CompletedRound } from '../../src/domain/entities/round'
import { CurrencyAmount } from '../../src/domain/value-objects/currency-amount'
import { EvmAddress } from '../../src/domain/value-objects/evm-address'

export class MockRoundRepository extends RoundRepository {
	private nextCompletedRound: CompletedRound | null = null

	setNextCompletedRound(round: CompletedRound | null) {
		this.nextCompletedRound = round
	}

	async getCompletedRounds() {
		return Promise.resolve([])
	}

	async getRoundsByIds() {
		return Promise.resolve([])
	}

	async getNextCompletedRound() {
		return Promise.resolve(this.nextCompletedRound)
	}
}

class MockStakeRepository extends StakeRepository {
	async getStakesWithOngoingRounds() {
		return Promise.resolve([])
	}
}

class MockRewardRepository extends RewardRepository {
	async getAvailableRewards(_userAddress: EvmAddress): Promise<CurrencyAmount[]> {
		return Promise.resolve([])
	}

	async getAccruedRewards(_userAddress: EvmAddress): Promise<CurrencyAmount[]> {
		return Promise.resolve([])
	}
}

@Module({
	providers: [
		{ provide: RoundRepository, useClass: MockRoundRepository },
		{ provide: StakeRepository, useClass: MockStakeRepository },
		{ provide: RewardRepository, useClass: MockRewardRepository },
	],
	exports: [RoundRepository, StakeRepository, RewardRepository],
})
export class MockIndexerModule {}
