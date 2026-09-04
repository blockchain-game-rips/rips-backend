import {
	getTierBias,
	getTierBiases,
} from '../../../src/domain/services/tier-biases'

const PROD_TIER_COUNT = 7
const SINGLE_TIER = 1

describe('getTierBiases', () => {
	it('favours the first tier and leaves the last one unbiased', () => {
		expect(getTierBiases(PROD_TIER_COUNT)).toEqual([
			2n,
			1n,
			1n,
			1n,
			0n,
			0n,
			0n,
		])
	})

	it('never rises as the tier gets rarer', () => {
		const biases = getTierBiases(PROD_TIER_COUNT)

		for (let i = 1; i < biases.length; i++) {
			expect(biases[i]).toBeLessThanOrEqual(biases[i - 1])
		}
	})

	it('leaves a lone tier unbiased, since it is both first and last', () => {
		expect(getTierBiases(SINGLE_TIER)).toEqual([0n])
	})

	it('rejects a tier outside the collection', () => {
		expect(() => getTierBias(PROD_TIER_COUNT, PROD_TIER_COUNT)).toThrow(
			/outside a collection/,
		)
	})

	it('rejects a collection with no tiers', () => {
		expect(() => getTierBiases(0)).toThrow(/must be positive/)
	})
})
