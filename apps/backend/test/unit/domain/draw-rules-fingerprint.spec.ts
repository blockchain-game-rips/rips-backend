import { renderDrawRulesFingerprint } from '../../../src/domain/services/draw-rules-fingerprint'
import { Card } from '../../../src/domain/value-objects/card'

const TIER_0 = 0
const TIER_1 = 1
const TIER_2 = 2

function card(id: number, tier: number): Card {
	return { id, tier, name: `Card ${id}`, imageUrl: `card-${id}.png` }
}

describe('renderDrawRulesFingerprint', () => {
	it('lists the card ids of every tier', () => {
		const fingerprint = renderDrawRulesFingerprint([
			[card(1, TIER_0), card(2, TIER_0)],
			[card(3, TIER_1)],
		])

		expect(fingerprint).toContain('cards=1,2|3')
	})

	it('does not depend on the order the cards arrive in', () => {
		const ascending = renderDrawRulesFingerprint([
			[card(1, TIER_0), card(2, TIER_0), card(3, TIER_0)],
		])

		const shuffled = renderDrawRulesFingerprint([
			[card(3, TIER_0), card(1, TIER_0), card(2, TIER_0)],
		])

		expect(shuffled).toEqual(ascending)
	})

	it('changes when a card is added', () => {
		const before = renderDrawRulesFingerprint([[card(1, TIER_0)]])
		const after = renderDrawRulesFingerprint([
			[card(1, TIER_0), card(2, TIER_0)],
		])

		expect(after).not.toEqual(before)
	})

	it('changes when a card moves to another tier', () => {
		const together = renderDrawRulesFingerprint([
			[card(1, TIER_0), card(2, TIER_0)],
			[],
		])

		const split = renderDrawRulesFingerprint([
			[card(1, TIER_0)],
			[card(2, TIER_1)],
		])

		expect(split).not.toEqual(together)
	})

	it('records the bias each tier was drawn with', () => {
		const fingerprint = renderDrawRulesFingerprint([
			[card(1, TIER_0)],
			[card(2, TIER_1)],
			[card(3, TIER_2)],
		])

		expect(fingerprint).toContain('biases=2,1,0')
	})
})
