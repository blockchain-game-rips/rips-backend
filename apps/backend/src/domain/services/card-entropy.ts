import { concatHex, encodePacked, keccak256, toHex } from 'viem'
import { RandomnessFulfillment } from '../entities/rip'

/**
 * Bump this whenever the derivation below changes shape, so a new scheme can
 * never be mistaken for the old one.
 */
const DOMAIN_SEPARATOR = 'rips.card.v1'

/**
 * Entropy for a single card draw, derived only from chain data.
 *
 * The event's position is hashed in not for entropy but to bind the draw to
 * settlement order: dropping it from the ordering without changing this
 * signature is impossible. It also identifies the rip uniquely, so no separate
 * rip id is needed.
 */
export function deriveCardEntropy(args: {
	fulfillment: RandomnessFulfillment
	entryNumber: number
}): bigint {
	const { fulfillment, entryNumber } = args
	const { randoms, blockNumber, logIndex } = fulfillment

	const encoded = concatHex([
		toHex(DOMAIN_SEPARATOR),
		encodePacked(
			['uint256', 'uint256', 'uint64', 'uint32', 'uint32'],
			[randoms.a, randoms.b, blockNumber, logIndex, entryNumber],
		),
	])

	return BigInt(keccak256(encoded))
}
