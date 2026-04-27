import { Module } from '@nestjs/common'
import { ReferralSystemRepository } from '../../src/application/interfaces/repositories/referral-system.repository'
import { RoundRepository } from '../../src/application/interfaces/repositories/round.repository'
import { StakeRepository } from '../../src/application/interfaces/repositories/stake.repository'
import { Referrer } from '../../src/domain/entities/referrer'
import { CompletedRound } from '../../src/domain/entities/round'
import { EvmAddress } from '../../src/domain/value-objects/evm-address'
import { ReferrerTierTable } from '../../src/domain/value-objects/referral-system'

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

class MockReferralSystemRepository extends ReferralSystemRepository {
	getReferrerByAddress = jest.fn<Promise<Referrer>, [EvmAddress]>()

	getReferrerTierTables = jest.fn<Promise<ReferrerTierTable[]>, []>()
}

@Module({
	providers: [
		{ provide: RoundRepository, useClass: MockRoundRepository },
		{ provide: StakeRepository, useClass: MockStakeRepository },
		{
			provide: ReferralSystemRepository,
			useClass: MockReferralSystemRepository,
		},
	],
	exports: [RoundRepository, StakeRepository, ReferralSystemRepository],
})
export class MockIndexerModule {}
