import { Module } from '@nestjs/common'
import { RoundRepository } from 'src/application/interfaces/repositories/round.repository'
import { StakeRepository } from 'src/application/interfaces/repositories/config.repository'

class MockRoundRepository extends RoundRepository {
	async getRounds() {
		return []
	}
}

class MockStakeRepository extends StakeRepository {
	async getStakes() {
		return []
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
