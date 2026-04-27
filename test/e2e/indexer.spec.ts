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

const CONFIG_1_ID = '1'
const CONFIG_2_ID = '2'

const STAKE_1_ROUND_1_ID = '1'
const STAKE_1_ROUND_2_ID = '2'
const STAKE_2_ROUND_1_ID = '3'

const TOTAL_STAKES = 2

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
		minPrize: parseEther('0.018'),
		maxPrize: parseEther('0.018'),
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
		minPrize: parseEther('0.036'),
		maxPrize: parseEther('0.036'),
	},
]

const DEPLOYER_PRIVATE_KEY =
	'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

const REFERRER_PRIVATE_KEY =
	'0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

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
	const referrer = privateKeyToAccount(REFERRER_PRIVATE_KEY)

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
		it('indexes all stakes', async () => {
			const stakes = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					'SELECT * FROM stake ORDER BY id',
				)
				return rows.length === TOTAL_STAKES ? rows : null
			})

			expect(stakes).toMatchObject([
				{ id: STAKE_1_ID, deleted: false },
				{ id: STAKE_2_ID, deleted: false },
			])
		})

		it('indexes all configs', async () => {
			const configs = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					'SELECT * FROM config ORDER BY id',
				)
				return rows.length === TOTAL_STAKES ? rows : null
			})

			expect(configs).toMatchObject([
				{
					id: CONFIG_1_ID,
					stake_id: STAKE_1_ID,
					ticket_cap: STAKE_1_TICKET_CAP.toString(),
					duration_seconds: DURATION.toString(),
					ticket_cost: STAKE_1_TICKET_COST.toString(),
					currency: NATIVE_CURRENCY,
				},
				{
					id: CONFIG_2_ID,
					stake_id: STAKE_2_ID,
					ticket_cap: STAKE_2_TICKET_CAP.toString(),
					duration_seconds: DURATION.toString(),
					ticket_cost: STAKE_2_TICKET_COST.toString(),
					currency: NATIVE_CURRENCY,
				},
			])
		})

		it('indexes all prize tiers', async () => {
			const TOTAL_TIERS =
				STAKE_1_PRIZE_TIERS.length + STAKE_2_PRIZE_TIERS.length

			const tiers = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					'SELECT * FROM prize_tier ORDER BY config_id, tier_index',
				)
				return rows.length === TOTAL_TIERS ? rows : null
			})

			expect(tiers).toMatchObject([
				...STAKE_1_PRIZE_TIERS.map((tier, i) => ({
					id: `${CONFIG_1_ID}-${i}`,
					config_id: CONFIG_1_ID,
					tier_index: i,
					prize_count: tier.prizeCount.toString(),
					min_prize: tier.minPrize.toString(),
					max_prize: tier.maxPrize.toString(),
				})),
				...STAKE_2_PRIZE_TIERS.map((tier, i) => ({
					id: `${CONFIG_2_ID}-${i}`,
					config_id: CONFIG_2_ID,
					tier_index: i,
					prize_count: tier.prizeCount.toString(),
					min_prize: tier.minPrize.toString(),
					max_prize: tier.maxPrize.toString(),
				})),
			])
		})
	})

	describe('buyTickets', () => {
		const TICKET_COUNT = 3n

		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await buyTickets(TICKET_COUNT)
		})

		it('creates initial rounds for each stake', async () => {
			const rounds = await waitForRecord(async () => {
				const rows: unknown[] =
					await dataSource.query(`SELECT * FROM round`)

				return rows.length > 0 ? rows : null
			})

			expect(rounds).toMatchObject([
				{
					id: STAKE_1_ROUND_1_ID,
					config_id: CONFIG_1_ID,
					status: 'FILLING',
					tickets_sold: TICKET_COUNT.toString(),
					vrf_request_status: 'NOT_REQUESTED',
				},
			])
		})

		it('indexes the TicketPurchase with correct fields', async () => {
			const purchase = await waitForRow(
				dataSource,
				`SELECT * FROM ticket_purchase WHERE round_id = '${STAKE_1_ROUND_1_ID}'`,
			)

			expect(purchase).toMatchObject({
				round_id: STAKE_1_ROUND_1_ID,
				user: deployer.address.toLowerCase(),
				ticket_count: TICKET_COUNT.toString(),
				start_ticket_index: '0',
				tx_hash: txHash,
			})
		})

		it('updates the round tickets_sold count', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_ROUND_1_ID}' AND tickets_sold = ${TICKET_COUNT}`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_ROUND_1_ID,
				tickets_sold: TICKET_COUNT.toString(),
			})
		})
	})

	describe('fillRound', () => {
		const REMAINING_TICKETS = STAKE_1_TICKET_CAP - 3n

		beforeAll(async () => {
			await buyTickets(REMAINING_TICKETS)
		})

		it('fills round 1 to ticket cap', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_ROUND_1_ID}' AND tickets_sold = '${STAKE_1_TICKET_CAP}'`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_ROUND_1_ID,
				tickets_sold: STAKE_1_TICKET_CAP.toString(),
				status: 'SEALED',
			})
		})
	})

	describe('requestVrf', () => {
		beforeAll(async () => {
			const txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'requestRandomness',
				args: [BigInt(STAKE_1_ROUND_1_ID)],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('marks round 1 as VRF REQUESTED with a vrf_request_id', async () => {
			const round = (await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_ROUND_1_ID}' AND vrf_request_status = 'REQUESTED'`,
			)) as Record<string, unknown>

			expect(round).toMatchObject({
				id: STAKE_1_ROUND_1_ID,
				vrf_request_status: 'REQUESTED',
				status: 'VRF_REQUESTED',
			})
			expect(round.vrf_request_id).not.toBeNull()
		})
	})

	describe('fulfillRandomWords', () => {
		beforeAll(async () => {
			const [round] = await dataSource.query(
				`SELECT vrf_request_id FROM round WHERE id = '${STAKE_1_ROUND_1_ID}'`,
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

		it('marks round 3 as VRF FULFILLED with random values', async () => {
			const round = (await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_ROUND_1_ID}' AND vrf_request_status = 'FULFILLED'`,
			)) as Record<string, unknown>

			expect(round).toMatchObject({
				id: STAKE_1_ROUND_1_ID,
				vrf_request_status: 'FULFILLED',
				status: 'CLAIMING',
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
					BigInt(STAKE_1_ROUND_1_ID),
					0n,
					10n,
					deployer.address,
					deployer.address,
				],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes the PrizeClaim with correct fields', async () => {
			const claim = (await waitForRow(
				dataSource,
				`SELECT * FROM prize_claim WHERE round_id = '${STAKE_1_ROUND_1_ID}'`,
			)) as Record<string, unknown>

			expect(claim).toMatchObject({
				round_id: STAKE_1_ROUND_1_ID,
				user: deployer.address.toLowerCase(),
				tx_hash: txHash,
			})
			expect(BigInt(claim.ticket_count as string)).toBeGreaterThan(0n)
			expect(BigInt(claim.amount as string)).toBeGreaterThan(0n)
		})

		it('updates round tickets_claimed count', async () => {
			const round = (await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_ROUND_1_ID}' AND tickets_claimed > 0`,
			)) as Record<string, unknown>

			expect(round).toMatchObject({
				id: STAKE_1_ROUND_1_ID,
				status: 'CLAIMED',
			})
			expect(Number(round.tickets_claimed)).toBeGreaterThan(0)
		})
	})

	describe('refunding', () => {
		const TICKET_COUNT = 2n

		beforeAll(async () => {
			await buyTickets(TICKET_COUNT)

			await increaseTime(publicClient, Number(DURATION) + 1)
		})

		it('updates round status to REFUNDING', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_ROUND_2_ID}'`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_ROUND_2_ID,
				status: 'REFUNDING',
			})
		})
	})

	describe('refund', () => {
		const TICKET_COUNT = 2n

		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'refund',
				args: [BigInt(STAKE_1_ROUND_2_ID), deployer.address],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes the Refund with correct fields', async () => {
			const refund = await waitForRow(
				dataSource,
				`SELECT * FROM refund WHERE round_id = '${STAKE_1_ROUND_2_ID}'`,
			)

			expect(refund).toMatchObject({
				round_id: STAKE_1_ROUND_2_ID,
				user: deployer.address.toLowerCase(),
				ticket_count: TICKET_COUNT.toString(),
				amount: (TICKET_COUNT * STAKE_1_TICKET_COST).toString(),
				tx_hash: txHash,
			})
		})

		it('updates round tickets_refunded count', async () => {
			const round = await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_1_ROUND_2_ID}' AND tickets_refunded = ${TICKET_COUNT}`,
			)

			expect(round).toMatchObject({
				id: STAKE_1_ROUND_2_ID,
				tickets_refunded: TICKET_COUNT.toString(),
				status: 'REFUNDED',
			})
		})
	})

	describe('admin setters', () => {
		const NEW_CALLBACK_GAS_LIMIT = 200_000

		let recipientHash: `0x${string}`
		let gasLimitHash: `0x${string}`

		beforeAll(async () => {
			recipientHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'setFeeRecipient',
				args: [deployer.address],
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

		it('indexes FeeRecipientUpdated', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM fee_recipient_updated WHERE tx_hash = '${recipientHash}'`,
			)

			expect(row).toMatchObject({
				fee_recipient: deployer.address.toLowerCase(),
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

		it('marks stake 1 as deleted', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM stake WHERE id = '${STAKE_1_ID}' AND deleted = true`,
			)

			expect(row).toMatchObject({
				id: STAKE_1_ID,
				deleted: true,
			})
		})
	})

	describe('setReferralTiers', () => {
		const REFERRAL_TIERS = [
			{ minVolume: parseEther('0.1'), feePercent: 1000 },
			{ minVolume: parseEther('1'), feePercent: 3000 },
		]

		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'setReferralTiers',
				args: [NATIVE_CURRENCY, REFERRAL_TIERS],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes ReferralTiersUpdated with currency and tiers', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM referral_tiers_updated WHERE tx_hash = '${txHash}'`,
			)

			expect(row).toMatchObject({
				currency: NATIVE_CURRENCY,
				tx_hash: txHash,
			})
		})

		it('indexes ReferralTier entries', async () => {
			const row = (await waitForRow(
				dataSource,
				`SELECT * FROM referral_tiers_updated WHERE tx_hash = '${txHash}'`,
			)) as Record<string, unknown>

			const tiers: unknown[] = await dataSource.query(
				`SELECT * FROM referral_tier WHERE update_id = '${row.id}' ORDER BY min_volume`,
			)

			expect(tiers).toMatchObject(
				REFERRAL_TIERS.map((tier) => ({
					min_volume: tier.minVolume.toString(),
					fee_percent: tier.feePercent,
				})),
			)
		})
	})

	describe('setReferrerCustomFee', () => {
		const CUSTOM_FEE_PERCENT = 5000

		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'setReferrerCustomFee',
				args: [referrer.address, CUSTOM_FEE_PERCENT],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes ReferrerCustomFeeUpdated', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM referrer_custom_fee_updated WHERE tx_hash = '${txHash}'`,
			)

			expect(row).toMatchObject({
				referrer: referrer.address.toLowerCase(),
				custom_fee_percent: CUSTOM_FEE_PERCENT,
				tx_hash: txHash,
			})
		})
	})

	describe('claimWithReferrer', () => {
		const TICKET_COUNT = STAKE_2_TICKET_CAP

		let claimTxHash: `0x${string}`

		beforeAll(async () => {
			await buyTicketsStake2(TICKET_COUNT)

			const requestTxHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'requestRandomness',
				args: [BigInt(STAKE_2_ROUND_1_ID)],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, requestTxHash)

			const round = (await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_2_ROUND_1_ID}' AND vrf_request_status = 'REQUESTED'`,
			)) as Record<string, unknown>
			const vrfRequestId = round.vrf_request_id as string

			const fulfillTxHash = await walletClient.writeContract({
				abi: vrfAbi,
				address: vrfAddress,
				functionName: 'fulfillRandomWords',
				args: [BigInt(vrfRequestId), ripsAddress],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, fulfillTxHash)

			await waitForRow(
				dataSource,
				`SELECT * FROM round WHERE id = '${STAKE_2_ROUND_1_ID}' AND vrf_request_status = 'FULFILLED'`,
			)

			claimTxHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'claimPrizes',
				args: [
					BigInt(STAKE_2_ROUND_1_ID),
					0n,
					10n,
					deployer.address,
					referrer.address,
				],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, claimTxHash)
		})

		it('indexes ReferralStateUpdated', async () => {
			const row = (await waitForRow(
				dataSource,
				`SELECT * FROM referrer_state_updated WHERE tx_hash = '${claimTxHash}'`,
			)) as Record<string, unknown>

			expect(row).toMatchObject({
				referrer: referrer.address.toLowerCase(),
				currency: NATIVE_CURRENCY,
				tx_hash: claimTxHash,
			})
			expect(row.period_start_time).toEqual(row.time)
		})

		it('indexes ReferralFeeAccrued', async () => {
			const row = (await waitForRow(
				dataSource,
				`SELECT * FROM referral_fee_accrued WHERE round_id = '${STAKE_2_ROUND_1_ID}'`,
			)) as Record<string, unknown>

			expect(row).toMatchObject({
				round_id: STAKE_2_ROUND_1_ID,
				referrer: referrer.address.toLowerCase(),
			})
			expect(BigInt(row.amount as string)).toBeGreaterThan(0n)
		})

		it('creates ReferrerReward with accrued amount', async () => {
			const row = (await waitForRow(
				dataSource,
				`SELECT * FROM referrer_reward WHERE referrer = '${referrer.address.toLowerCase()}' AND currency = '${NATIVE_CURRENCY}'`,
			)) as Record<string, unknown>

			expect(row).toMatchObject({
				referrer: referrer.address.toLowerCase(),
				currency: NATIVE_CURRENCY,
				withdrawn: '0',
				seized: '0',
			})
			expect(BigInt(row.accrued as string)).toBeGreaterThan(0n)
		})
	})

	describe('withdrawReferrerFee', () => {
		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'withdrawReferrerFee',
				args: [referrer.address, NATIVE_CURRENCY],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes ReferrerFeeWithdrawn', async () => {
			const row = (await waitForRow(
				dataSource,
				`SELECT * FROM referrer_fee_withdrawn WHERE tx_hash = '${txHash}'`,
			)) as Record<string, unknown>

			expect(row).toMatchObject({
				referrer: referrer.address.toLowerCase(),
				currency: NATIVE_CURRENCY,
				tx_hash: txHash,
			})
			expect(BigInt(row.amount as string)).toBeGreaterThan(0n)
		})

		it('updates ReferrerReward withdrawn amount', async () => {
			const row = (await waitForRow(
				dataSource,
				`SELECT * FROM referrer_reward WHERE referrer = '${referrer.address.toLowerCase()}' AND currency = '${NATIVE_CURRENCY}' AND withdrawn > 0`,
			)) as Record<string, unknown>

			expect(row).toMatchObject({
				referrer: referrer.address.toLowerCase(),
				currency: NATIVE_CURRENCY,
				seized: '0',
			})
			expect(BigInt(row.accrued as string)).toBeGreaterThan(0n)
			expect(BigInt(row.withdrawn as string)).toBeGreaterThan(0n)
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

	async function buyTicketsStake2(ticketCount: bigint) {
		const txHash = await walletClient.writeContract({
			...ripsAbiAndAddress,
			functionName: 'buyTickets',
			args: [BigInt(STAKE_2_ID), ticketCount, deployer.address],
			value: ticketCount * STAKE_2_TICKET_COST,
			gas: DEFAULT_GAS,
		})

		await waitForReceipt(publicClient, txHash)

		return txHash
	}
})
