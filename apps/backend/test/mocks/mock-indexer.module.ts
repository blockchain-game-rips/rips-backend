import { Module } from '@nestjs/common'
import { PresetRepository } from '../../src/application/interfaces/repositories/preset.repository'
import { ReferralSystemRepository } from '../../src/application/interfaces/repositories/referral-system.repository'
import { RipRepository } from '../../src/application/interfaces/repositories/rip.repository'
import { Referrer } from '../../src/domain/entities/referrer'
import { CompletedRip } from '../../src/domain/entities/rip'
import { EvmAddress } from '../../src/domain/value-objects/evm-address'
import { ReferrerTierTable } from '../../src/domain/value-objects/referral-system'

export class MockRipRepository extends RipRepository {
	private nextCompletedRip: CompletedRip | null = null

	setNextCompletedRip(rip: CompletedRip | null) {
		this.nextCompletedRip = rip
	}

	async getCompletedRips() {
		return Promise.resolve([])
	}

	async getRipsByIds() {
		return Promise.resolve([])
	}

	async getNextCompletedRip() {
		return Promise.resolve(this.nextCompletedRip)
	}
}

class MockPresetRepository extends PresetRepository {
	async getPresetsWithOngoingRips() {
		return Promise.resolve([])
	}
}

class MockReferralSystemRepository extends ReferralSystemRepository {
	getReferrerByAddress = jest.fn<Promise<Referrer>, [EvmAddress]>()

	getReferrerTierTables = jest.fn<Promise<ReferrerTierTable[]>, []>()
}

@Module({
	providers: [
		{ provide: RipRepository, useClass: MockRipRepository },
		{ provide: PresetRepository, useClass: MockPresetRepository },
		{
			provide: ReferralSystemRepository,
			useClass: MockReferralSystemRepository,
		},
	],
	exports: [RipRepository, PresetRepository, ReferralSystemRepository],
})
export class MockIndexerModule {}
