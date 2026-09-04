import { deriveCardEntropy } from '../../../src/domain/services/card-entropy'
import { resolveRandomCard } from '../../../src/domain/services/payout-utils'
import { CardCollection } from '../../../src/domain/value-objects/card-collection'

const TIER = 6
const CARDS_IN_TIER = 6
const DRAWS = 1000
const CONFIGURED_BIAS = 2n

const FULFILLMENT = {
	randoms: { a: 12345678901234567890n, b: 98765432109876543210n },
	blockNumber: 1_000n,
	logIndex: 3,
}

function entropyFor(entryNumber: number): bigint {
	return deriveCardEntropy({ fulfillment: FULFILLMENT, entryNumber })
}

function makeCollection(
	size: number,
	ownedIndices: number[] = [],
): CardCollection {
	return Array.from({ length: size }, (_, i) => ({
		card: {
			id: TIER * 1000 + i,
			tier: TIER,
			name: `card-${i}`,
			imageUrl: '',
		},
		count: ownedIndices.includes(i) ? 1 : 0,
	}))
}

function distinctPicks(collection: CardCollection, bias: bigint): Set<number> {
	const picked = new Set<number>()

	for (let i = 0; i < DRAWS; i++) {
		picked.add(resolveRandomCard(collection, bias, entropyFor(i)).id)
	}

	return picked
}

describe('resolveRandomCard', () => {
	describe('when a bias is configured for the tier', () => {
		it('spreads picks across the whole tier', () => {
			const picked = distinctPicks(
				makeCollection(CARDS_IN_TIER),
				CONFIGURED_BIAS,
			)

			expect(picked.size).toBe(CARDS_IN_TIER)
		})

		it('favours unseen cards over owned ones', () => {
			const allButLastOwned = [0, 1, 2, 3, 4]
			const collection = makeCollection(CARDS_IN_TIER, allButLastOwned)

			let unseenHits = 0

			for (let i = 0; i < DRAWS; i++) {
				const card = resolveRandomCard(
					collection,
					CONFIGURED_BIAS,
					entropyFor(i),
				)
				if (card.id === collection[CARDS_IN_TIER - 1].card.id)
					unseenHits++
			}

			expect(unseenHits).toBeGreaterThan(DRAWS / CARDS_IN_TIER)
		})
	})

	describe('when the tier has no configured bias', () => {
		const missingBias = ([] as bigint[])[TIER]

		it('throws instead of collapsing to the fallback card', () => {
			expect(() =>
				resolveRandomCard(
					makeCollection(CARDS_IN_TIER),
					missingBias,
					entropyFor(0),
				),
			).toThrow(/not configured/)
		})
	})

	describe('when the tier has no cards', () => {
		it('throws instead of returning undefined', () => {
			expect(() =>
				resolveRandomCard([], CONFIGURED_BIAS, entropyFor(0)),
			).toThrow(/empty tier/)
		})
	})
})
