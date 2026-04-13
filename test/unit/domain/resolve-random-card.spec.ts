import { resolveRandomCard } from 'src/domain/services/prize-utils'
import { CardCollection } from 'src/domain/value-objects/card-collection'

const CARD_A = { id: 1, name: 'A', tier: 0, imageUrl: '' }
const CARD_B = { id: 2, name: 'B', tier: 0, imageUrl: '' }
const CARD_C = { id: 3, name: 'C', tier: 0, imageUrl: '' }

// How many times we call resolveRandomCard per test — more samples = more accurate frequencies
const SAMPLES = 10_000

// Allowed deviation from the expected probability, e.g. 0.05 = ±5%
const TOLERANCE = 0.05

// Calls resolveRandomCard SAMPLES times and returns how often each card was picked,
// as a fraction of total draws (e.g. 0.33 means picked 33% of the time).
// The map key is card.id, the value is the observed frequency (0..1).
function sampleFrequencies(
	collection: CardCollection,
	bias: number,
): Map<number, number> {
	// card.id → how many times this card was returned
	const counts = new Map<number, number>()

	for (let i = 0; i < SAMPLES; i++) {
		const card = resolveRandomCard(collection, bias)
		counts.set(card.id, (counts.get(card.id) ?? 0) + 1)
	}

	// Convert raw counts to frequencies by dividing by total samples
	return new Map(
		[...counts.entries()].map(([id, count]) => [id, count / SAMPLES]),
	)
}

describe('resolveRandomCard', () => {
	describe('when all cards are unseen (k=0)', () => {
		it('distributes uniformly regardless of bias', () => {
			const collection: CardCollection = [
				{ card: CARD_A, count: 0 },
				{ card: CARD_B, count: 0 },
				{ card: CARD_C, count: 0 },
			]

			const freq = sampleFrequencies(collection, 2)

			// All unseen → all get boost weight → uniform
			expect(freq.get(CARD_A.id)).toBeCloseTo(1 / 3, 1)
			expect(freq.get(CARD_B.id)).toBeCloseTo(1 / 3, 1)
			expect(freq.get(CARD_C.id)).toBeCloseTo(1 / 3, 1)
		})
	})

	describe('when all cards are seen (k=n)', () => {
		it('distributes uniformly regardless of bias', () => {
			const collection: CardCollection = [
				{ card: CARD_A, count: 3 },
				{ card: CARD_B, count: 1 },
				{ card: CARD_C, count: 2 },
			]

			const freq = sampleFrequencies(collection, 2)

			// All seen → boost=1 → uniform
			expect(freq.get(CARD_A.id)).toBeCloseTo(1 / 3, 1)
			expect(freq.get(CARD_B.id)).toBeCloseTo(1 / 3, 1)
			expect(freq.get(CARD_C.id)).toBeCloseTo(1 / 3, 1)
		})
	})

	describe('when 1 of 3 cards is seen', () => {
		// k=1, n=3, c=1/3, bias=2 → boost = 1 + 2*(2/3) ≈ 2.33
		// weights: seen=1, unseen=2.33, unseen=2.33 → total=5.66
		// P(seen) ≈ 17.7%, P(each unseen) ≈ 41.2%
		const collection: CardCollection = [
			{ card: CARD_A, count: 2 },
			{ card: CARD_B, count: 0 },
			{ card: CARD_C, count: 0 },
		]

		const BIAS = 2
		const boost = 1 + BIAS * (1 - 1 / 3)
		const total = 1 + boost + boost
		const expectedSeen = 1 / total
		const expectedUnseen = boost / total

		let freq: Map<number, number>

		beforeAll(() => {
			freq = sampleFrequencies(collection, BIAS)
		})

		it('seen card appears less frequently than unseen cards', () => {
			expect(freq.get(CARD_A.id)).toBeLessThan(freq.get(CARD_B.id)!)
			expect(freq.get(CARD_A.id)).toBeLessThan(freq.get(CARD_C.id)!)
		})

		it('seen card frequency matches expected probability', () => {
			expect(freq.get(CARD_A.id)!).toBeCloseTo(expectedSeen, 1)
		})

		it('unseen cards frequency matches expected probability', () => {
			expect(freq.get(CARD_B.id)!).toBeCloseTo(expectedUnseen, 1)
			expect(freq.get(CARD_C.id)!).toBeCloseTo(expectedUnseen, 1)
		})

		it('unseen cards are boost times more likely than the seen card', () => {
			const ratio = freq.get(CARD_B.id)! / freq.get(CARD_A.id)!
			expect(ratio).toBeGreaterThan(boost - TOLERANCE * boost)
			expect(ratio).toBeLessThan(boost + TOLERANCE * boost)
		})
	})

	describe('bias=0 always distributes uniformly', () => {
		it('ignores seen/unseen status when bias is 0', () => {
			const collection: CardCollection = [
				{ card: CARD_A, count: 5 },
				{ card: CARD_B, count: 0 },
				{ card: CARD_C, count: 0 },
			]

			const freq = sampleFrequencies(collection, 0)

			expect(freq.get(CARD_A.id)).toBeCloseTo(1 / 3, 1)
			expect(freq.get(CARD_B.id)).toBeCloseTo(1 / 3, 1)
			expect(freq.get(CARD_C.id)).toBeCloseTo(1 / 3, 1)
		})
	})
})
