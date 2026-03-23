import { RoundStatus as RoundStatusRaw } from 'generated/graphql/generated'
import { EIP155 } from 'src/constants'
import { Currency } from 'src/domain/entities/currency'
import { RoundStatus } from 'src/domain/entities/round'
import { composeChainId } from 'src/domain/services/chain-id-utils'
import { composeCurrencyId } from 'src/domain/services/currency-id-utils'
import { IndexerService } from 'src/infrastructure/indexer/indexer.service'
import { IndexerRoundRepository } from 'src/infrastructure/indexer/rounds.repository'

const TICKET_PRICE = 1_000_000_000_000_000_000n // 1 ETH in wei

const MOCK_CURRENCY: Currency = {
	id: composeCurrencyId(
		composeChainId(EIP155, '8453'),
		'0x0000000000000000000000000000000000000000',
	),
	chainAddress: {
		chain: { namespace: EIP155, reference: '8453' },
		address: '0x0000000000000000000000000000000000000000',
	},
	symbol: 'ETH',
	name: 'ETH',
	decimals: 18,
}

const STAKE_CONFIG_RAW = {
	__typename: 'StakeConfig' as const,
	id: '1',
	ticketCap: '100',
	ticketCost: TICKET_PRICE.toString(),
	durationSeconds: '3600',
}

const EMPTY_COLLECTIONS = {
	ticketPurchases: [],
	prizesClaimed: [],
	refunds: [],
}

function makeRoundRaw(overrides: {
	status: RoundStatusRaw
	startTime?: string
	ticketsSold?: number
	refunds?: {
		id: string
		user: string
		amount: string
		txHash: string
		time: string
	}[]
	prizesClaimed?: {
		id: string
		claimer: string
		amount: string
		txHash: string
		time: string
	}[]
}) {
	return {
		__typename: 'Round' as const,
		id: '42',
		stakeConfigId: '1',
		stakeConfig: STAKE_CONFIG_RAW,
		startTime: overrides.startTime ?? new Date().toISOString(),
		ticketsSold: overrides.ticketsSold ?? 2,
		status: overrides.status,
		ticketPurchases: [],
		prizesClaimed: overrides.prizesClaimed ?? [],
		refunds: overrides.refunds ?? [],
	}
}

function makeMockIndexer(
	rounds: ReturnType<typeof makeRoundRaw>[],
): IndexerService {
	return {
		sdk: {
			GetRounds: jest.fn().mockResolvedValue({ rounds }),
		},
	} as unknown as IndexerService
}

describe('IndexerRoundRepository', () => {
	function makeRepo(indexer: IndexerService) {
		return new IndexerRoundRepository(indexer, MOCK_CURRENCY)
	}

	describe('Active status', () => {
		const DURATION_SECONDS = Number(STAKE_CONFIG_RAW.durationSeconds)

		it('returns FILLING when round has not expired', async () => {
			const startTime = new Date(
				Date.now() - (DURATION_SECONDS - 60) * 1000,
			).toISOString()
			const indexer = makeMockIndexer([
				makeRoundRaw({ status: RoundStatusRaw.Active, startTime }),
			])

			const [round] = await makeRepo(indexer).getRounds()

			expect(round.status).toBe(RoundStatus.FILLING)
		})

		it('returns REFUNDING when expired and refunds are partial', async () => {
			const startTime = new Date(
				Date.now() - (DURATION_SECONDS + 60) * 1000,
			).toISOString()
			const ticketsSold = 2
			const partialRefund = (
				TICKET_PRICE * BigInt(ticketsSold) -
				1n
			).toString()

			const indexer = makeMockIndexer([
				makeRoundRaw({
					status: RoundStatusRaw.Active,
					startTime,
					ticketsSold,
					refunds: [
						{
							id: '1',
							user: '0xabc',
							amount: partialRefund,
							txHash: '0x1',
							time: '',
						},
					],
				}),
			])

			const [round] = await makeRepo(indexer).getRounds()

			expect(round.status).toBe(RoundStatus.REFUNDING)
		})

		it('returns REFUNDED when expired and refunds cover the full pool', async () => {
			const startTime = new Date(
				Date.now() - (DURATION_SECONDS + 60) * 1000,
			).toISOString()
			const ticketsSold = 2
			const fullRefund = (TICKET_PRICE * BigInt(ticketsSold)).toString()

			const indexer = makeMockIndexer([
				makeRoundRaw({
					status: RoundStatusRaw.Active,
					startTime,
					ticketsSold,
					refunds: [
						{
							id: '1',
							user: '0xabc',
							amount: fullRefund,
							txHash: '0x1',
							time: '',
						},
					],
				}),
			])

			const [round] = await makeRepo(indexer).getRounds()

			expect(round.status).toBe(RoundStatus.REFUNDED)
		})
	})

	it('returns SEALED for SoldOut', async () => {
		const indexer = makeMockIndexer([
			makeRoundRaw({ status: RoundStatusRaw.SoldOut }),
		])

		const [round] = await makeRepo(indexer).getRounds()

		expect(round.status).toBe(RoundStatus.SEALED)
	})

	it('returns VRFREQUESTED for VrfRequested', async () => {
		const indexer = makeMockIndexer([
			makeRoundRaw({ status: RoundStatusRaw.VrfRequested }),
		])

		const [round] = await makeRepo(indexer).getRounds()

		expect(round.status).toBe(RoundStatus.VRFREQUESTED)
	})

	describe('Finalized status', () => {
		it('returns CLAIMING when prizes claimed are partial', async () => {
			const ticketsSold = 2
			const partialClaim = (
				TICKET_PRICE * BigInt(ticketsSold) -
				1n
			).toString()

			const indexer = makeMockIndexer([
				makeRoundRaw({
					status: RoundStatusRaw.Finalized,
					ticketsSold,
					prizesClaimed: [
						{
							id: '1',
							claimer: '0xabc',
							amount: partialClaim,
							txHash: '0x1',
							time: '',
						},
					],
				}),
			])

			const [round] = await makeRepo(indexer).getRounds()

			expect(round.status).toBe(RoundStatus.CLAIMING)
		})

		it('returns CLAIMED when prizes claimed cover the full pool', async () => {
			const ticketsSold = 2
			const fullClaim = (TICKET_PRICE * BigInt(ticketsSold)).toString()

			const indexer = makeMockIndexer([
				makeRoundRaw({
					status: RoundStatusRaw.Finalized,
					ticketsSold,
					prizesClaimed: [
						{
							id: '1',
							claimer: '0xabc',
							amount: fullClaim,
							txHash: '0x1',
							time: '',
						},
					],
				}),
			])

			const [round] = await makeRepo(indexer).getRounds()

			expect(round.status).toBe(RoundStatus.CLAIMED)
		})
	})

	it('maps stake fields correctly', async () => {
		const indexer = makeMockIndexer([
			makeRoundRaw({ status: RoundStatusRaw.SoldOut }),
		])

		const [round] = await makeRepo(indexer).getRounds()

		expect(round.id).toBe(42)
		expect(round.stake.id).toBe(1)
		expect(round.stake.ticketPrice.amount).toBe(TICKET_PRICE)
		expect(round.stake.ticketPrice.currency).toBe(MOCK_CURRENCY)
		expect(round.stake.durationSeconds).toBe(
			Number(STAKE_CONFIG_RAW.durationSeconds),
		)
	})
})
