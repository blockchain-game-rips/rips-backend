import { parseEther } from 'viem'
import { DataSource } from 'typeorm'
import ripsAbi from '../contracts/abi/Rips.json'
import { useAnvil } from '../utils/anvil'
import { usePostgres } from '../utils/postgres'
import { useProcessor } from '../utils/processor'
import { SetupResult, setupContracts } from '../utils/setup'

const CHAIN_ID = 31337

const TICKET_CAP = 8n
const TICKET_COST = parseEther('0.0025')
const DURATION = 86400n

// 1 + 2 + 5 = 8 prizes = ticketCap
// 1*0.011 + 2*0.002 + 5*0.001 = 0.011 + 0.004 + 0.005 = 0.02 ETH = 8 * 0.0025
const PRIZE_TIERS = [
	{
		prizeCount: 1n,
		minPrize: parseEther('0.011'),
		maxPrize: parseEther('0.011'),
	},
	{
		prizeCount: 2n,
		minPrize: parseEther('0.002'),
		maxPrize: parseEther('0.002'),
	},
	{
		prizeCount: 5n,
		minPrize: parseEther('0.001'),
		maxPrize: parseEther('0.001'),
	},
]

async function waitForRecord<T>(
	query: () => Promise<T | null | undefined>,
	timeoutMs = 15_000,
): Promise<T> {
	const deadline = Date.now() + timeoutMs

	while (Date.now() < deadline) {
		const result = await query()
		if (result != null) return result
		await new Promise((resolve) => setTimeout(resolve, 500))
	}

	throw new Error(`Timed out after ${timeoutMs}ms waiting for indexed record`)
}

describe('indexer e2e', () => {
	const { postgres } = usePostgres()
	const { anvils } = useAnvil({ chainId: CHAIN_ID })

	let setup: SetupResult
	let dataSource: DataSource

	beforeAll(async () => {
		setup = await setupContracts(anvils[0].port)
	})

	useProcessor(() => ({
		RPC_ENDPOINT: `http://127.0.0.1:${anvils[0].port}`,
		CONTRACT_ADDRESS: setup.ripsAddress,
		CONTRACT_DEPLOYED_AT: '0',
		DB_URL: postgres.connectionUrl,
	}))

	beforeAll(async () => {
		dataSource = new DataSource({
			type: 'postgres',
			url: postgres.connectionUrl,
			subscribers: [],
		})
		await dataSource.initialize()
	})

	afterAll(async () => {
		await dataSource?.destroy()
	})

	describe('createStake', () => {
		beforeAll(async () => {
			const { ripsAddress, owner, walletClient, publicClient } = setup

			const hash = await walletClient.writeContract({
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'createStake',
				args: [
					{
						prizeDistribution: PRIZE_TIERS,
						ticketCap: TICKET_CAP,
						duration: DURATION,
						ticketCost: TICKET_COST,
					},
				],
				account: owner,
				chain: null,
			})

			await publicClient.waitForTransactionReceipt({ hash })
		})

		it('indexes the StakeConfig with correct fields', async () => {
			const stakeConfig = await waitForRecord(() =>
				dataSource
					.query(`SELECT * FROM stake_config WHERE id = '1'`)
					.then(([row]: unknown[]) => row ?? null),
			)

			expect(stakeConfig).toMatchObject({
				id: '1',
				ticket_cap: TICKET_CAP.toString(),
				duration: DURATION.toString(),
				ticket_cost: TICKET_COST.toString(),
				deleted: false,
			})
		})

		it('indexes all 3 prize tiers', async () => {
			const tiers = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					`SELECT * FROM prize_tier WHERE stake_config_id = '1' ORDER BY tier_index`,
				)
				return rows.length === PRIZE_TIERS.length ? rows : null
			})

			expect(tiers).toMatchObject([
				{
					id: '1-0',
					tier_index: 0,
					prize_count: PRIZE_TIERS[0].prizeCount.toString(),
					min_prize: PRIZE_TIERS[0].minPrize.toString(),
					max_prize: PRIZE_TIERS[0].maxPrize.toString(),
				},
				{
					id: '1-1',
					tier_index: 1,
					prize_count: PRIZE_TIERS[1].prizeCount.toString(),
					min_prize: PRIZE_TIERS[1].minPrize.toString(),
					max_prize: PRIZE_TIERS[1].maxPrize.toString(),
				},
				{
					id: '1-2',
					tier_index: 2,
					prize_count: PRIZE_TIERS[2].prizeCount.toString(),
					min_prize: PRIZE_TIERS[2].minPrize.toString(),
					max_prize: PRIZE_TIERS[2].maxPrize.toString(),
				},
			])
		})
	})
})
