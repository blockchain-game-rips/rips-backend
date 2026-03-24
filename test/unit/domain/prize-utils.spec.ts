import { PrizeTier } from 'src/domain/entities/stake'
import { resolveTicketPrize } from 'src/domain/services/prize-utils'

// config: [[1,2],[6,8],[20,30,40,50]] ether — mirrors RipsMath_CalculatePrizeAmount
const PRIZE_1 = 1n
const PRIZE_2 = 2n
const PRIZE_3 = 6n
const PRIZE_4 = 8n
const PRIZE_5 = 20n
const PRIZE_6 = 30n
const PRIZE_7 = 40n
const PRIZE_8 = 50n

const TICKET_CAP = 8
// randomA=1, randomB=n-1 yields prizeNumber = ticketNumber for ticketNumber in 1..n
// because (1 * k + (n-1)) % n + 1 = (k-1) % n + 1 = k
const RANDOM_A = 1n
const RANDOM_B = BigInt(TICKET_CAP) - 1n // 7n

const PRIZE_DISTRIBUTION: PrizeTier[] = [
	{ prizeCount: 2n, minPrize: PRIZE_1, maxPrize: PRIZE_2 },
	{ prizeCount: 2n, minPrize: PRIZE_3, maxPrize: PRIZE_4 },
	{ prizeCount: 4n, minPrize: PRIZE_5, maxPrize: PRIZE_8 },
]

// With randomA=1 and randomB=7, prizeNumber = (1 * ticketNumber + 7) % 8 + 1 = ticketNumber
// So ticket i maps to prizeNumber i (for tickets 1..8)
describe('resolveTicketPrize', () => {
	describe('when the prize number is in the first tier', () => {
		it('should return PRIZE_1 for prize number 1', () => {
			expect(
				resolveTicketPrize(
					1,
					RANDOM_A,
					RANDOM_B,
					TICKET_CAP,
					PRIZE_DISTRIBUTION,
				),
			).toBe(PRIZE_1)
		})

		it('should return PRIZE_2 for prize number 2', () => {
			expect(
				resolveTicketPrize(
					2,
					RANDOM_A,
					RANDOM_B,
					TICKET_CAP,
					PRIZE_DISTRIBUTION,
				),
			).toBe(PRIZE_2)
		})
	})

	describe('when the prize number is in a middle tier', () => {
		it('should return PRIZE_3 for prize number 3', () => {
			expect(
				resolveTicketPrize(
					3,
					RANDOM_A,
					RANDOM_B,
					TICKET_CAP,
					PRIZE_DISTRIBUTION,
				),
			).toBe(PRIZE_3)
		})

		it('should return PRIZE_4 for prize number 4', () => {
			expect(
				resolveTicketPrize(
					4,
					RANDOM_A,
					RANDOM_B,
					TICKET_CAP,
					PRIZE_DISTRIBUTION,
				),
			).toBe(PRIZE_4)
		})
	})

	describe('when the prize number is in the last tier', () => {
		it('should return PRIZE_5 for prize number 5', () => {
			expect(
				resolveTicketPrize(
					5,
					RANDOM_A,
					RANDOM_B,
					TICKET_CAP,
					PRIZE_DISTRIBUTION,
				),
			).toBe(PRIZE_5)
		})

		it('should return PRIZE_6 for prize number 6', () => {
			expect(
				resolveTicketPrize(
					6,
					RANDOM_A,
					RANDOM_B,
					TICKET_CAP,
					PRIZE_DISTRIBUTION,
				),
			).toBe(PRIZE_6)
		})

		it('should return PRIZE_7 for prize number 7', () => {
			expect(
				resolveTicketPrize(
					7,
					RANDOM_A,
					RANDOM_B,
					TICKET_CAP,
					PRIZE_DISTRIBUTION,
				),
			).toBe(PRIZE_7)
		})

		it('should return PRIZE_8 for prize number 8', () => {
			expect(
				resolveTicketPrize(
					8,
					RANDOM_A,
					RANDOM_B,
					TICKET_CAP,
					PRIZE_DISTRIBUTION,
				),
			).toBe(PRIZE_8)
		})
	})

	describe('when the single-prize tier is used', () => {
		const singleTier: PrizeTier[] = [
			{ prizeCount: 1n, minPrize: 100n, maxPrize: 200n },
		]

		it('should return minPrize regardless of rank', () => {
			expect(
				resolveTicketPrize(1, RANDOM_A, RANDOM_B, 1, singleTier),
			).toBe(100n)
		})
	})

	describe('when randomA and randomB produce wrapping modulo', () => {
		it('should wrap ticket number modulo ticketCap correctly', () => {
			// ticketNumber=8, randomA=1, randomB=0: (1*8 + 0) % 8 + 1 = 0 + 1 = 1 → prizeNumber=1
			expect(resolveTicketPrize(8, 1n, 0n, 8, PRIZE_DISTRIBUTION)).toBe(
				PRIZE_1,
			)
		})

		it('should apply randomA and randomB offsets', () => {
			// ticketNumber=1, randomA=3, randomB=2: (3*1 + 2) % 8 + 1 = 5 + 1 = 6 → prizeNumber=6 → last tier rank 2
			// last tier: min=20, max=50, count=4, rank=2 → 20 + (30 * (2-1)) / (4-1) = 20 + 10 = 30
			expect(resolveTicketPrize(1, 3n, 2n, 8, PRIZE_DISTRIBUTION)).toBe(
				30n,
			)
		})
	})
})

// Ranked distribution: prize for slot k equals k (minPrize = maxPrize = k)
// This lets the returned prize amount act as a direct readout of the prize number
const rankedDistribution = (n: number): PrizeTier[] =>
	Array.from({ length: n }, (_, i) => ({
		prizeCount: 1n,
		minPrize: BigInt(i + 1),
		maxPrize: BigInt(i + 1),
	}))

describe('calculatePrizeNumber', () => {
	describe('when the result is always between 1 and n inclusive', () => {
		it('should return 1 for a=0, b=0', () => {
			// (0 * k + 0) % n + 1 = 1 for any k
			expect(
				resolveTicketPrize(1, 0n, 0n, 4, rankedDistribution(4)),
			).toBe(1n)
		})

		it('should return n when prizeNumber lands on the last slot', () => {
			// (1 * 4 + 0) % 4 + 1 = 0 + 1 = 1, use b=n-1: (1*4 + 3) % 4 + 1 = 3 + 1 = 4
			expect(
				resolveTicketPrize(4, 1n, 3n, 4, rankedDistribution(4)),
			).toBe(4n)
		})

		it('should clamp via modulo for large inputs', () => {
			// (999 * 500 + 123) % 1000 + 1 = 499623 % 1000 + 1 = 623 + 1 = 624
			expect(
				resolveTicketPrize(
					500,
					999n,
					123n,
					1000,
					rankedDistribution(1000),
				),
			).toBe(624n)
		})
	})

	describe('when different ticket numbers produce different prize numbers', () => {
		// odd a guarantees a bijection over Z/nZ when n is a power of 2
		const ODD_A = 3n
		const B = 0n
		const N = 8

		it('should cover all prize numbers in [1, n] exactly once across all tickets', () => {
			const results = Array.from({ length: N }, (_, i) =>
				resolveTicketPrize(i + 1, ODD_A, B, N, rankedDistribution(N)),
			)

			expect(new Set(results).size).toBe(N)
		})

		it('should produce different prize numbers for two distinct tickets', () => {
			// ticketA=1: (3*1 + 0) % 8 + 1 = 4
			// ticketB=2: (3*2 + 0) % 8 + 1 = 7
			const resultA = resolveTicketPrize(
				1,
				ODD_A,
				B,
				N,
				rankedDistribution(N),
			)
			const resultB = resolveTicketPrize(
				2,
				ODD_A,
				B,
				N,
				rankedDistribution(N),
			)

			expect(resultA).not.toBe(resultB)
		})
	})
})
