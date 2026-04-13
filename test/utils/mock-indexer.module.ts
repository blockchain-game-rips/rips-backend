import { Module } from '@nestjs/common'
import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import { StakeRepository } from 'src/application/interfaces/repositories/stake.repository'
import { CompletedRound } from 'src/domain/entities/round'

export class MockRoundRepository extends RoundRepository {
	private nextClaimedRound: CompletedRound | null = null

	setNextClaimedRound(round: CompletedRound | null) {
		this.nextClaimedRound = round
	}

	async getCompletedRounds() {
		return Promise.resolve([])
	}

	async getNextClaimedRound() {
		return Promise.resolve(this.nextClaimedRound)
	}
}

class MockStakeRepository extends StakeRepository {
	async getStakesWithOngoingRounds() {
		return Promise.resolve([])
	}
}

@Module({
	providers: [
		{ provide: RoundRepository, useClass: MockRoundRepository },
		{ provide: StakeRepository, useClass: MockStakeRepository },
	],
	exports: [RoundRepository, StakeRepository],
})
export class MockIndexerModule {}
