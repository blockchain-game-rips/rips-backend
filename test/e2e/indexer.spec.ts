import { DataSource } from 'typeorm'
import { parseEther } from 'viem'
import ripsAbi from '../contracts/abi/Rips.json'
import vrfAbi from '../contracts/abi/VRFCoordinatorV2_5Mock.json'
import { increaseTime, useAnvil } from '../utils/anvil'
import { writeAndWait } from '../utils/contracts'
import { waitForRecord, waitForRow } from '../utils/db'
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

			await writeAndWait(walletClient, publicClient, {
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
			})
		})

		it('indexes the StakeConfig with correct fields', async () => {
			const stakeConfig = await waitForRow(
				dataSource,
				`SELECT * FROM stake_config WHERE id = '1'`,
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

	describe('buyTickets', () => {
		const TICKET_COUNT = 3n

		let txHash: `0x${string}`

		beforeAll(async () => {
			const { ripsAddress, deployer, walletClient, publicClient } = setup

			txHash = await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'buyTickets',
				args: [1n, TICKET_COUNT, deployer.address],
				value: TICKET_COUNT * TICKET_COST,
				account: deployer,
			})
		})

		it('indexes the TicketPurchase with correct fields', async () => {
			const purchase = await waitForRow(
				dataSource,
				`SELECT * FROM ticket_purchase WHERE round_id = '1'`,
			)

			expect(purchase).toMatchObject({
				round_id: '1',
				buyer: setup.deployer.address.toLowerCase(),
				count: TICKET_COUNT.toString(),
				tx_hash: txHash,
			})
		})

		it('updates the round tickets_sold count', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '1' AND tickets_sold = ${TICKET_COUNT}`,
			)

			expect(round).toMatchObject({
				id: '1',
				tickets_sold: Number(TICKET_COUNT),
			})
		})
	})

	describe('fillRound', () => {
		const REMAINING_TICKETS = TICKET_CAP - 3n

		beforeAll(async () => {
			const { ripsAddress, deployer, walletClient, publicClient } = setup

			await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'buyTickets',
				args: [1n, REMAINING_TICKETS, deployer.address],
				value: REMAINING_TICKETS * TICKET_COST,
				account: deployer,
			})
		})

		it('marks round 1 as SoldOut', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '1' AND status = 'SoldOut'`,
			)

			expect(round).toMatchObject({
				id: '1',
				tickets_sold: Number(TICKET_CAP),
				status: 'SoldOut',
			})
		})

		it('creates round 2 for the same stake', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '2'`,
			)

			expect(round).toMatchObject({
				id: '2',
				stake_config_id: '1',
				tickets_sold: 0,
				status: 'Active',
			})
		})
	})

	describe('requestVrf', () => {
		beforeAll(async () => {
			const { ripsAddress, deployer, walletClient, publicClient } = setup

			await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'requestRandomness',
				args: [1n],
				account: deployer,
			})
		})

		it('marks round 1 as VRFRequested with a vrf_request_id', async () => {
			const round = (await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '1' AND status = 'VRFRequested'`,
			)) as Record<string, unknown>

			expect(round).toMatchObject({
				id: '1',
				status: 'VRFRequested',
			})
			expect(round.vrf_request_id).not.toBeNull()
		})
	})

	describe('fulfillRandomWords', () => {
		beforeAll(async () => {
			const {
				vrfAddress,
				ripsAddress,
				deployer,
				walletClient,
				publicClient,
			} = setup

			const [round] = await dataSource.query(
				`SELECT vrf_request_id FROM round WHERE id = '1'`,
			)
			const vrfRequestId: string = (round as Record<string, unknown>)
				.vrf_request_id as string

			await writeAndWait(walletClient, publicClient, {
				address: vrfAddress,
				abi: vrfAbi,
				functionName: 'fulfillRandomWords',
				args: [BigInt(vrfRequestId), ripsAddress],
				account: deployer,
			})
		})

		it('marks round 1 as Finalized with random values', async () => {
			const round = (await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '1' AND status = 'Finalized'`,
			)) as Record<string, unknown>

			expect(round).toMatchObject({
				id: '1',
				status: 'Finalized',
			})
			expect(round.random_a).not.toBeNull()
			expect(round.random_b).not.toBeNull()
		})
	})

	describe('claimPrizes', () => {
		let txHash: `0x${string}`

		beforeAll(async () => {
			const { ripsAddress, deployer, walletClient, publicClient } = setup

			txHash = await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'claimPrizes',
				args: [1n, 0n, 10n, deployer.address],
				account: deployer,
			})
		})

		it('indexes the PrizeClaim with correct fields', async () => {
			const claim = (await waitForRow(
				dataSource,
				`SELECT * FROM prize_claim WHERE round_id = '1'`,
			)) as Record<string, unknown>

			expect(claim).toMatchObject({
				round_id: '1',
				claimer: setup.deployer.address.toLowerCase(),
				tx_hash: txHash,
			})
			expect(BigInt(claim.amount as string)).toBeGreaterThan(0n)
		})
	})

	describe('refund', () => {
		const TICKET_COUNT = 2n
		let txHash: `0x${string}`

		beforeAll(async () => {
			const { ripsAddress, deployer, walletClient, publicClient } = setup

			await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'buyTickets',
				args: [1n, TICKET_COUNT, deployer.address],
				value: TICKET_COUNT * TICKET_COST,
				account: deployer,
			})

			await increaseTime(setup.publicClient, Number(DURATION) + 1)

			txHash = await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'refund',
				args: [2n, deployer.address],
				account: deployer,
			})
		})

		it('indexes the Refund with correct fields', async () => {
			const refund = (await waitForRow(
				dataSource,
				`SELECT * FROM refund WHERE round_id = '2'`,
			)) as Record<string, unknown>

			expect(refund).toMatchObject({
				round_id: '2',
				user: setup.deployer.address.toLowerCase(),
				amount: (TICKET_COUNT * TICKET_COST).toString(),
				tx_hash: txHash,
			})
		})
	})

	describe('admin setters', () => {
		const NEW_FEE_PERCENT = 1000n
		const NEW_CALLBACK_GAS_LIMIT = 200_000

		let newFeeRecipient: `0x${string}`
		let feeHash: `0x${string}`
		let recipientHash: `0x${string}`
		let gasLimitHash: `0x${string}`

		beforeAll(async () => {
			const { ripsAddress, owner, deployer, walletClient, publicClient } =
				setup

			newFeeRecipient = deployer.address

			feeHash = await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'setProtocolFee',
				args: [NEW_FEE_PERCENT],
				account: owner,
			})

			recipientHash = await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'setFeeRecipient',
				args: [newFeeRecipient],
				account: owner,
			})

			gasLimitHash = await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'updateCallbackGasLimit',
				args: [NEW_CALLBACK_GAS_LIMIT],
				account: owner,
			})
		})

		it('indexes ProtocolFeeUpdated', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM protocol_fee_updated WHERE tx_hash = '${feeHash}'`,
			)

			expect(row).toMatchObject({
				fee_percent: NEW_FEE_PERCENT.toString(),
				tx_hash: feeHash,
			})
		})

		it('indexes FeeRecipientUpdated', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM fee_recipient_updated WHERE tx_hash = '${recipientHash}'`,
			)

			expect(row).toMatchObject({
				fee_recipient: newFeeRecipient.toLowerCase(),
				tx_hash: recipientHash,
			})
		})

		it('indexes CallbackGasLimitUpdated', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM callback_gas_limit_updated WHERE tx_hash = '${gasLimitHash}'`,
			)

			expect(row).toMatchObject({
				callback_gas_limit: NEW_CALLBACK_GAS_LIMIT,
				tx_hash: gasLimitHash,
			})
		})
	})

	describe('deleteStake', () => {
		beforeAll(async () => {
			const { ripsAddress, owner, walletClient, publicClient } = setup

			await writeAndWait(walletClient, publicClient, {
				address: ripsAddress,
				abi: ripsAbi,
				functionName: 'deleteStake',
				args: [1n],
				account: owner,
			})
		})

		it('marks StakeConfig 1 as deleted', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM stake_config WHERE id = '1' AND deleted = true`,
			)

			expect(row).toMatchObject({
				id: '1',
				deleted: true,
			})
		})
	})
})
