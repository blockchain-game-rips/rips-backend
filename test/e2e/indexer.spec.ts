import path from 'path'
import { waitForReceipt } from 'test/utils/contracts'
import { DataSource } from 'typeorm'
import {
	Chain,
	createPublicClient,
	createWalletClient,
	http,
	parseEther,
	PublicClient,
	Transport,
	WalletClient,
} from 'viem'
import { LocalAccount, privateKeyToAccount } from 'viem/accounts'
import vrfAbi from '../contracts/abi/VRFCoordinatorV2_5Mock.json'
import { ripsAbi } from '../contracts/abi/rips'
import { increaseTime, useAnvil } from '../utils/anvil'
import { waitForRecord, waitForRow } from '../utils/db'
import { usePostgres } from '../utils/postgres'
import { useProcessor } from '../utils/processor'
import deployments from '../utils/state/deployments.json'

const CHAIN_ID = 8453

const ANVIL_STATE_PATH = path.resolve(
	__dirname,
	'../utils/state/anvil-state.json',
)

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'
const DURATION = 300n // 5 minutes

const STAKE_1_ID = '1'
const STAKE_2_ID = '2'

const UNSETTLED_STAKE_1_ROUND_ID = '1'
const UNSETTLED_STAKE_2_ROUND_ID = '2'

// Round 1 (stake 1) is expired at test time; buyTickets creates round 3
// fillRound fills round 3 (Sealed) and creates round 4
// refund round is round 4 (2 tickets bought, then expired)
const STAKE_1_BUY_ROUND_ID = '3'
const STAKE_1_FILL_ROUND_ID = '3'
const STAKE_1_NEXT_ROUND_ID = '4'
const STAKE_1_REFUND_ROUND_ID = '4'

const STAKE_1_TICKET_CAP = 8n
const STAKE_1_TICKET_COST = parseEther('0.005')
const STAKE_1_PRIZE_TIERS = [
	{
		prizeCount: 5n,
		minPrize: parseEther('0.0008'),
		maxPrize: parseEther('0.0012'),
	},
	{
		prizeCount: 2n,
		minPrize: parseEther('0.007'),
		maxPrize: parseEther('0.008'),
	},
	{
		prizeCount: 1n,
		minPrize: parseEther('0.02'),
		maxPrize: parseEther('0.02'),
	},
]

const STAKE_2_TICKET_CAP = 8n
const STAKE_2_TICKET_COST = parseEther('0.01')
const STAKE_2_PRIZE_TIERS = [
	{
		prizeCount: 5n,
		minPrize: parseEther('0.0016'),
		maxPrize: parseEther('0.0024'),
	},
	{
		prizeCount: 2n,
		minPrize: parseEther('0.014'),
		maxPrize: parseEther('0.016'),
	},
	{
		prizeCount: 1n,
		minPrize: parseEther('0.04'),
		maxPrize: parseEther('0.04'),
	},
]

const DEPLOYER_PRIVATE_KEY =
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const ripsAddress = deployments.rips as `0x${string}`
const ripsAbiAndAddress = { abi: ripsAbi, address: ripsAddress }
const vrfAddress = deployments.vrfCoordinator as `0x${string}`

const DEFAULT_GAS = 5_000_000n

describe('indexer e2e', () => {
	const { postgres } = usePostgres()
	const { anvils } = useAnvil({
		chainId: CHAIN_ID,
		pathToState: ANVIL_STATE_PATH,
	})

	let dataSource: DataSource

	const deployer = privateKeyToAccount(DEPLOYER_PRIVATE_KEY)

	let walletClient: WalletClient<Transport, Chain, LocalAccount, undefined>

	let publicClient: PublicClient<Transport, Chain, undefined, undefined>

	beforeAll(() => {
		const rpcUrl = `http://127.0.0.1:${anvils[0].port}`

		walletClient = createWalletClient({
			transport: http(rpcUrl),
			account: deployer,
		})
		publicClient = createPublicClient({ transport: http(rpcUrl) })
	})

	useProcessor(() => ({
		RPC_ENDPOINT: `http://127.0.0.1:${anvils[0].port}`,
		CONTRACT_ADDRESS: ripsAddress,
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
		const TOTAL_STAKES = 2

		it('indexes all stake configs', async () => {
			const stakes = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					'SELECT * FROM stake_config ORDER BY id',
				)
				return rows.length === TOTAL_STAKES ? rows : null
			})

			expect(stakes).toMatchObject([
				{
					id: STAKE_1_ID,
					ticket_cap: STAKE_1_TICKET_CAP.toString(),
					duration_seconds: DURATION.toString(),
					ticket_cost: STAKE_1_TICKET_COST.toString(),
					currency: NATIVE_CURRENCY,
					deleted: false,
				},
				{
					id: STAKE_2_ID,
					ticket_cap: STAKE_2_TICKET_CAP.toString(),
					duration_seconds: DURATION.toString(),
					ticket_cost: STAKE_2_TICKET_COST.toString(),
					currency: NATIVE_CURRENCY,
					deleted: false,
				},
			])
		})

		it('indexes all prize tiers', async () => {
			const TOTAL_TIERS =
				STAKE_1_PRIZE_TIERS.length + STAKE_2_PRIZE_TIERS.length

			const tiers = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					'SELECT * FROM prize_tier ORDER BY stake_config_id, tier_index',
				)
				return rows.length === TOTAL_TIERS ? rows : null
			})

			expect(tiers).toMatchObject([
				...STAKE_1_PRIZE_TIERS.map((tier, i) => ({
					id: `${STAKE_1_ID}-${i}`,
					tier_index: i,
					prize_count: tier.prizeCount.toString(),
					min_prize: tier.minPrize.toString(),
					max_prize: tier.maxPrize.toString(),
				})),
				...STAKE_2_PRIZE_TIERS.map((tier, i) => ({
					id: `${STAKE_2_ID}-${i}`,
					tier_index: i,
					prize_count: tier.prizeCount.toString(),
					min_prize: tier.minPrize.toString(),
					max_prize: tier.maxPrize.toString(),
				})),
			])
		})

		it('creates initial rounds for each stake as Unsettled', async () => {
			const rounds = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					`SELECT * FROM round WHERE id IN ('${UNSETTLED_STAKE_1_ROUND_ID}', '${UNSETTLED_STAKE_2_ROUND_ID}') ORDER BY id`,
				)
				return rows.length === TOTAL_STAKES ? rows : null
			})

			expect(rounds).toMatchObject([
				{
					id: UNSETTLED_STAKE_1_ROUND_ID,
					stake_config_id: STAKE_1_ID,
					tickets_sold: 0,
					status: 'Unsettled',
				},
				{
					id: UNSETTLED_STAKE_2_ROUND_ID,
					stake_config_id: STAKE_2_ID,
					tickets_sold: 0,
					status: 'Unsettled',
				},
			])
		})
	})

	describe('buyTickets', () => {
		const TICKET_COUNT = 3n

		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await buyTickets(TICKET_COUNT)
		})

		it('indexes the TicketPurchase with correct fields', async () => {
			const purchase = await waitForRow(
				dataSource,
				`SELECT * FROM ticket_purchase WHERE round_id = '${STAKE_1_BUY_ROUND_ID}'`,
			)

			expect(purchase).toMatchObject({
				round_id: STAKE_1_BUY_ROUND_ID,
				user: deployer.address.toLowerCase(),
				ticket_count: TICKET_COUNT.toString(),
				start_ticket_index: '0',
				tx_hash: txHash,
			})
		})

		it('updates the round tickets_sold count', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_BUY_ROUND_ID}' AND tickets_sold = ${TICKET_COUNT}`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_BUY_ROUND_ID,
				tickets_sold: Number(TICKET_COUNT),
			})
		})
	})

	describe('fillRound', () => {
		const REMAINING_TICKETS = STAKE_1_TICKET_CAP - 3n

		beforeAll(async () => {
			await buyTickets(REMAINING_TICKETS)
		})

		it('marks round 3 as Sealed', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_FILL_ROUND_ID}' AND status = 'Sealed'`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_FILL_ROUND_ID,
				tickets_sold: Number(STAKE_1_TICKET_CAP),
				status: 'Sealed',
			})
		})

		it('creates round 4 for stake 1 as Unsettled', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_NEXT_ROUND_ID}'`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_NEXT_ROUND_ID,
				stake_config_id: STAKE_1_ID,
				tickets_sold: 0,
				status: 'Unsettled',
			})
		})
	})

	describe('requestVrf', () => {
		beforeAll(async () => {
			const txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'requestRandomness',
				args: [BigInt(STAKE_1_FILL_ROUND_ID)],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('marks round 3 as VRFRequested with a vrf_request_id', async () => {
			const round = (await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_FILL_ROUND_ID}' AND status = 'VRFRequested'`,
			)) as Record<string, unknown>

			expect(round).toMatchObject({
				id: STAKE_1_FILL_ROUND_ID,
				status: 'VRFRequested',
			})
			expect(round.vrf_request_id).not.toBeNull()
		})
	})

	describe('fulfillRandomWords', () => {
		beforeAll(async () => {
			const [round] = await dataSource.query(
				`SELECT vrf_request_id FROM round WHERE id = '${STAKE_1_FILL_ROUND_ID}'`,
			)
			const vrfRequestId: string = (round as Record<string, unknown>)
				.vrf_request_id as string

			const txHash = await walletClient.writeContract({
				abi: vrfAbi,
				address: vrfAddress,
				functionName: 'fulfillRandomWords',
				args: [BigInt(vrfRequestId), ripsAddress],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('marks round 3 as Claiming with random values', async () => {
			const round = (await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_FILL_ROUND_ID}' AND status = 'Claiming'`,
			)) as Record<string, unknown>

			expect(round).toMatchObject({
				id: STAKE_1_FILL_ROUND_ID,
				status: 'Claiming',
			})
			expect(round.random_a).not.toBeNull()
			expect(round.random_b).not.toBeNull()
		})
	})

	describe('claimPrizes', () => {
		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'claimPrizes',
				args: [
					BigInt(STAKE_1_FILL_ROUND_ID),
					0n,
					10n,
					deployer.address,
				],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes the PrizeClaim with correct fields', async () => {
			const claim = (await waitForRow(
				dataSource,
				`SELECT * FROM prize_claim WHERE round_id = '${STAKE_1_FILL_ROUND_ID}'`,
			)) as Record<string, unknown>

			expect(claim).toMatchObject({
				round_id: STAKE_1_FILL_ROUND_ID,
				user: deployer.address.toLowerCase(),
				tx_hash: txHash,
			})
			expect(BigInt(claim.ticket_count as string)).toBeGreaterThan(0n)
			expect(BigInt(claim.amount as string)).toBeGreaterThan(0n)
		})

		it('marks round 3 as Claimed when all tickets are claimed', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_FILL_ROUND_ID}' AND status = 'Claimed'`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_FILL_ROUND_ID,
				status: 'Claimed',
				tickets_claimed: Number(STAKE_1_TICKET_CAP),
			})
		})
	})

	describe('refund', () => {
		const TICKET_COUNT = 2n

		let txHash: `0x${string}`

		beforeAll(async () => {
			await buyTickets(TICKET_COUNT)

			await increaseTime(publicClient, Number(DURATION) + 1)

			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'refund',
				args: [BigInt(STAKE_1_REFUND_ROUND_ID), deployer.address],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes the Refund with correct fields', async () => {
			const refund = await waitForRow(
				dataSource,
				`SELECT * FROM refund WHERE round_id = '${STAKE_1_REFUND_ROUND_ID}'`,
			)

			expect(refund).toMatchObject({
				round_id: STAKE_1_REFUND_ROUND_ID,
				user: deployer.address.toLowerCase(),
				ticket_count: TICKET_COUNT.toString(),
				amount: (TICKET_COUNT * STAKE_1_TICKET_COST).toString(),
				tx_hash: txHash,
			})
		})

		it('marks round 4 as Refunded when all tickets are refunded', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_REFUND_ROUND_ID}' AND status = 'Refunded'`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_REFUND_ROUND_ID,
				status: 'Refunded',
				tickets_refunded: Number(TICKET_COUNT),
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
			newFeeRecipient = deployer.address

			feeHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'setProtocolFee',
				args: [NEW_FEE_PERCENT],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, feeHash)

			recipientHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'setFeeRecipient',
				args: [newFeeRecipient],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, recipientHash)

			gasLimitHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'updateCallbackGasLimit',
				args: [NEW_CALLBACK_GAS_LIMIT],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, gasLimitHash)
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
			const txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'deleteStake',
				args: [BigInt(STAKE_1_ID)],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('marks StakeConfig 1 as deleted', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM stake_config WHERE id = '${STAKE_1_ID}' AND deleted = true`,
			)

			expect(row).toMatchObject({
				id: STAKE_1_ID,
				deleted: true,
			})
		})
	})

	async function buyTickets(ticketCount: bigint) {
		const txHash = await walletClient.writeContract({
			...ripsAbiAndAddress,
			functionName: 'buyTickets',
			args: [BigInt(STAKE_1_ID), ticketCount, deployer.address],
			value: ticketCount * STAKE_1_TICKET_COST,
			gas: DEFAULT_GAS,
		})

		await waitForReceipt(publicClient, txHash)

		return txHash
	}
})
