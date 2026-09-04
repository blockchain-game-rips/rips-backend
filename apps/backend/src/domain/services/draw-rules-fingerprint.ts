import { Card } from '../value-objects/card'
import { getTierBiases } from './tier-biases'

const TIER_SEPARATOR = '|'
const ID_SEPARATOR = ','
const SECTION_SEPARATOR = ';'

/**
 * Everything a draw depends on besides chain data: which cards exist, and how
 * strongly each tier boosts a card the player is missing.
 *
 * Rendered as a readable string rather than a hash — it is only ever compared
 * for equality, and when it does differ the error should say what changed.
 */
export function renderDrawRulesFingerprint(cardTiers: Card[][]): string {
	return [
		`cards=${renderCardTiers(cardTiers)}`,
		`biases=${renderTierBiases(cardTiers.length)}`,
	].join(SECTION_SEPARATOR)
}

/**
 * Order-independent: cards are sorted by id, so the order the database hands
 * them back cannot change the fingerprint.
 */
function renderCardTiers(cardTiers: Card[][]): string {
	return cardTiers
		.map((tier) =>
			tier
				.map((card) => card.id)
				.sort((a, b) => a - b)
				.join(ID_SEPARATOR),
		)
		.join(TIER_SEPARATOR)
}

/**
 * The biases as computed, not the formula that produced them: the formula is
 * free to change, and the fingerprint has to notice when it does.
 */
function renderTierBiases(tierCount: number): string {
	return getTierBiases(tierCount).join(ID_SEPARATOR)
}
