import { ripsAbi } from '@rips/abi'
import {
	ANVIL_STATE_PATH,
	deployments,
	increaseTime,
	useAnvil,
} from '@rips/test-harness'
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
import { waitForRecord, waitForRow } from '../utils/db'
import { usePostgres } from '../utils/postgres'
import { useProcessor } from '../utils/processor'

const CHAIN_ID = 8453

const TEST_HEAD_POLL_INTERVAL_MS = '50'

const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'
const DURATION = 300n // 5 minutes

const PRESET_1_ID = '1'
const PRESET_2_ID = '2'

const CONFIG_1_ID = '1'
const CONFIG_2_ID = '2'

const PRESET_1_RIP_1_ID = '1'
const PRESET_1_RIP_2_ID = '2'
const PRESET_2_RIP_1_ID = '3'
const PRESET_2_RIP_2_ID = '4'

const TOTAL_PRESETS = 2

const PRESET_1_ENTRY_CAP = 8n
const PRESET_1_ENTRY_PRICE = parseEther('0.005')
const PRESET_1_PAYOUT_TIERS = [
	{
		payoutCount: 5n,
		minPayout: parseEther('0.0008'),
		maxPayout: parseEther('0.0012'),
	},
	{
		payoutCount: 2n,
		minPayout: parseEther('0.007'),
		maxPayout: parseEther('0.008'),
	},
	{
		payoutCount: 1n,
		minPayout: parseEther('0.018'),
		maxPayout: parseEther('0.018'),
	},
]

const PRESET_2_ENTRY_CAP = 8n
const PRESET_2_ENTRY_PRICE = parseEther('0.01')
const PRESET_2_PAYOUT_TIERS = [
	{
		payoutCount: 5n,
		minPayout: parseEther('0.0016'),
		maxPayout: parseEther('0.0024'),
	},
	{
		payoutCount: 2n,
		minPayout: parseEther('0.014'),
		maxPayout: parseEther('0.016'),
	},
	{
		payoutCount: 1n,
		minPayout: parseEther('0.036'),
		maxPayout: parseEther('0.036'),
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
		HEAD_POLL_INTERVAL_MS: TEST_HEAD_POLL_INTERVAL_MS,
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

	describe('createPreset', () => {
		it('indexes all presets', async () => {
			const presets = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					'SELECT * FROM preset ORDER BY id',
				)
				return rows.length === TOTAL_PRESETS ? rows : null
			})

			expect(presets).toMatchObject([
				{ id: PRESET_1_ID, deleted: false },
				{ id: PRESET_2_ID, deleted: false },
			])
		})

		it('indexes all configs', async () => {
			const configs = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					'SELECT * FROM config ORDER BY id',
				)
				return rows.length === TOTAL_PRESETS ? rows : null
			})

			expect(configs).toMatchObject([
				{
					id: CONFIG_1_ID,
					preset_id: PRESET_1_ID,
					entry_cap: PRESET_1_ENTRY_CAP.toString(),
					duration_seconds: DURATION.toString(),
					entry_price: PRESET_1_ENTRY_PRICE.toString(),
					currency: NATIVE_CURRENCY,
				},
				{
					id: CONFIG_2_ID,
					preset_id: PRESET_2_ID,
					entry_cap: PRESET_2_ENTRY_CAP.toString(),
					duration_seconds: DURATION.toString(),
					entry_price: PRESET_2_ENTRY_PRICE.toString(),
					currency: NATIVE_CURRENCY,
				},
			])
		})

		it('indexes all payout tiers', async () => {
			const TOTAL_TIERS =
				PRESET_1_PAYOUT_TIERS.length + PRESET_2_PAYOUT_TIERS.length

			const tiers = await waitForRecord(async () => {
				const rows: unknown[] = await dataSource.query(
					'SELECT * FROM payout_tier ORDER BY config_id, tier_index',
				)
				return rows.length === TOTAL_TIERS ? rows : null
			})

			expect(tiers).toMatchObject([
				...PRESET_1_PAYOUT_TIERS.map((tier, i) => ({
					id: `${CONFIG_1_ID}-${i}`,
					config_id: CONFIG_1_ID,
					tier_index: i,
					payout_count: tier.payoutCount.toString(),
					min_payout: tier.minPayout.toString(),
					max_payout: tier.maxPayout.toString(),
				})),
				...PRESET_2_PAYOUT_TIERS.map((tier, i) => ({
					id: `${CONFIG_2_ID}-${i}`,
					config_id: CONFIG_2_ID,
					tier_index: i,
					payout_count: tier.payoutCount.toString(),
					min_payout: tier.minPayout.toString(),
					max_payout: tier.maxPayout.toString(),
				})),
			])
		})
	})

	describe('buyEntries', () => {
		const ENTRY_COUNT = 3n

		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await buyEntries(ENTRY_COUNT)
		})

		it('creates initial rips for each preset', async () => {
			const rips = await waitForRecord(async () => {
				const rows: unknown[] =
					await dataSource.query(`SELECT * FROM rip`)

				return rows.length > 0 ? rows : null
			})

			expect(rips).toMatchObject([
				{
					id: PRESET_1_RIP_1_ID,
					config_id: CONFIG_1_ID,
					status: 'FILLING',
					entries_sold: ENTRY_COUNT.toString(),
					vrf_request_status: 'NOT_REQUESTED',
				},
			])
		})

		it('indexes the EntryPurchase with correct fields', async () => {
			const purchase = await waitForRow(
				dataSource,
				`SELECT * FROM entry_purchase WHERE rip_id = '${PRESET_1_RIP_1_ID}'`,
			)

			expect(purchase).toMatchObject({
				rip_id: PRESET_1_RIP_1_ID,
				user: deployer.address.toLowerCase(),
				entry_count: ENTRY_COUNT.toString(),
				start_entry_index: '0',
				tx_hash: txHash,
			})
		})

		it('updates the rip entries_sold count', async () => {
			const rip = await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_1_RIP_1_ID}' AND entries_sold = ${ENTRY_COUNT}`,
			)

			expect(rip).toMatchObject({
				id: PRESET_1_RIP_1_ID,
				entries_sold: ENTRY_COUNT.toString(),
			})
		})
	})

	describe('fillRip', () => {
		const REMAINING_ENTRIES = PRESET_1_ENTRY_CAP - 3n

		beforeAll(async () => {
			console.time('buyEntries')
			await buyEntries(REMAINING_ENTRIES)
			console.timeEnd('buyEntries')
		})

		it('fills rip 1 to entry cap', async () => {
			console.time('waitForRow')

			const rip = await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_1_RIP_1_ID}' AND entries_sold = '${PRESET_1_ENTRY_CAP}'`,
			)

			console.timeEnd('waitForRow')

			expect(rip).toMatchObject({
				id: PRESET_1_RIP_1_ID,
				entries_sold: PRESET_1_ENTRY_CAP.toString(),
				status: 'SEALED',
			})
		})
	})

	describe('requestVrf', () => {
		beforeAll(async () => {
			const txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'requestRandomness',
				args: [BigInt(PRESET_1_RIP_1_ID)],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('marks rip 1 as VRF REQUESTED with a vrf_request_id', async () => {
			const rip = (await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_1_RIP_1_ID}' AND vrf_request_status = 'REQUESTED'`,
			)) as Record<string, unknown>

			expect(rip).toMatchObject({
				id: PRESET_1_RIP_1_ID,
				vrf_request_status: 'REQUESTED',
				status: 'VRF_REQUESTED',
			})
			expect(rip.vrf_request_id).not.toBeNull()
		})
	})

	describe('fulfillRandomWords', () => {
		beforeAll(async () => {
			const [rip] = await dataSource.query(
				`SELECT vrf_request_id FROM rip WHERE id = '${PRESET_1_RIP_1_ID}'`,
			)
			const vrfRequestId: string = (rip as Record<string, unknown>)
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

		it('marks rip 3 as VRF FULFILLED with random values', async () => {
			const rip = (await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_1_RIP_1_ID}' AND vrf_request_status = 'FULFILLED'`,
			)) as Record<string, unknown>

			expect(rip).toMatchObject({
				id: PRESET_1_RIP_1_ID,
				vrf_request_status: 'FULFILLED',
				status: 'CLAIMING',
			})
			expect(rip.random_a).not.toBeNull()
			expect(rip.random_b).not.toBeNull()
		})

		it('records the settlement key from the RandomnessFulfilled log', async () => {
			const rip = (await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_1_RIP_1_ID}' AND settle_block_number IS NOT NULL`,
			)) as Record<string, unknown>

			expect(rip.settle_block_number).not.toBeNull()
			expect(rip.settle_log_index).not.toBeNull()
		})
	})

	describe('claimPayouts', () => {
		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'claimPayout',
				args: [
					BigInt(PRESET_1_RIP_1_ID),
					10n,
					deployer.address,
					deployer.address,
				],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes the PayoutClaim with correct fields', async () => {
			const claim = (await waitForRow(
				dataSource,
				`SELECT * FROM payout_claim WHERE rip_id = '${PRESET_1_RIP_1_ID}'`,
			)) as Record<string, unknown>

			expect(claim).toMatchObject({
				rip_id: PRESET_1_RIP_1_ID,
				user: deployer.address.toLowerCase(),
				tx_hash: txHash,
			})
			expect(BigInt(claim.entry_count as string)).toBeGreaterThan(0n)
			expect(BigInt(claim.amount as string)).toBeGreaterThan(0n)
		})

		it('updates rip entries_claimed count', async () => {
			const rip = (await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_1_RIP_1_ID}' AND entries_claimed > 0`,
			)) as Record<string, unknown>

			expect(rip).toMatchObject({
				id: PRESET_1_RIP_1_ID,
				status: 'CLAIMED',
			})
			expect(Number(rip.entries_claimed)).toBeGreaterThan(0)
		})
	})

	describe('refunding', () => {
		const ENTRY_COUNT = 2n

		beforeAll(async () => {
			await buyEntries(ENTRY_COUNT)

			await increaseTime(publicClient, Number(DURATION) + 1)
		})

		it('updates rip status to REFUNDING', async () => {
			const rip = await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_1_RIP_2_ID}'`,
			)

			expect(rip).toMatchObject({
				id: PRESET_1_RIP_2_ID,
				status: 'REFUNDING',
			})
		})
	})

	describe('refund', () => {
		const ENTRY_COUNT = 2n

		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'refund',
				args: [BigInt(PRESET_1_RIP_2_ID), deployer.address],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('indexes the Refund with correct fields', async () => {
			const refund = await waitForRow(
				dataSource,
				`SELECT * FROM refund WHERE rip_id = '${PRESET_1_RIP_2_ID}'`,
			)

			expect(refund).toMatchObject({
				rip_id: PRESET_1_RIP_2_ID,
				user: deployer.address.toLowerCase(),
				entry_count: ENTRY_COUNT.toString(),
				amount: (ENTRY_COUNT * PRESET_1_ENTRY_PRICE).toString(),
				tx_hash: txHash,
			})
		})

		it('updates rip entries_refunded count', async () => {
			const rip = await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_1_RIP_2_ID}' AND entries_refunded = ${ENTRY_COUNT}`,
			)

			expect(rip).toMatchObject({
				id: PRESET_1_RIP_2_ID,
				entries_refunded: ENTRY_COUNT.toString(),
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

	describe('deletePreset', () => {
		beforeAll(async () => {
			const txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'deletePreset',
				args: [BigInt(PRESET_1_ID)],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('marks preset 1 as deleted', async () => {
			const row = await waitForRow(
				dataSource,
				`SELECT * FROM preset WHERE id = '${PRESET_1_ID}' AND deleted = true`,
			)

			expect(row).toMatchObject({
				id: PRESET_1_ID,
				deleted: true,
			})
		})
	})

	describe('setReferralTiers', () => {
		const REFERRAL_TIERS = [
			{ minVolume: parseEther('0.1'), feeBps: 1000 },
			{ minVolume: parseEther('1'), feeBps: 3000 },
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
					fee_bps: tier.feeBps,
				})),
			)
		})
	})

	describe('setReferrerCustomFee', () => {
		const CUSTOM_FEE_BPS = 5000

		let txHash: `0x${string}`

		beforeAll(async () => {
			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'setReferrerCustomFee',
				args: [referrer.address, CUSTOM_FEE_BPS],
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
				custom_fee_bps: CUSTOM_FEE_BPS,
				tx_hash: txHash,
			})
		})
	})

	describe('claimWithReferrer', () => {
		const ENTRY_COUNT = PRESET_2_ENTRY_CAP

		let claimTxHash: `0x${string}`

		beforeAll(async () => {
			await buyEntriesPreset2(ENTRY_COUNT)

			const requestTxHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'requestRandomness',
				args: [BigInt(PRESET_2_RIP_1_ID)],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, requestTxHash)

			const rip = (await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_2_RIP_1_ID}' AND vrf_request_status = 'REQUESTED'`,
			)) as Record<string, unknown>
			const vrfRequestId = rip.vrf_request_id as string

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
				`SELECT * FROM rip WHERE id = '${PRESET_2_RIP_1_ID}' AND vrf_request_status = 'FULFILLED'`,
			)

			claimTxHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'claimPayout',
				args: [
					BigInt(PRESET_2_RIP_1_ID),
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
				`SELECT * FROM referral_fee_accrued WHERE rip_id = '${PRESET_2_RIP_1_ID}'`,
			)) as Record<string, unknown>

			expect(row).toMatchObject({
				rip_id: PRESET_2_RIP_1_ID,
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

	describe('cancelRip', () => {
		const ENTRY_COUNT = 2n

		let txHash: `0x${string}`

		beforeAll(async () => {
			// Preset 2's earlier rip sold out and settled, so entering again opens
			// a fresh one rather than adding to it.
			await buyEntriesPreset2(ENTRY_COUNT)

			await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_2_RIP_2_ID}' AND status = 'FILLING'`,
			)

			txHash = await walletClient.writeContract({
				...ripsAbiAndAddress,
				functionName: 'cancelRip',
				args: [BigInt(PRESET_2_RIP_2_ID)],
				gas: DEFAULT_GAS,
			})
			await waitForReceipt(publicClient, txHash)
		})

		it('moves the rip out of FILLING before its duration elapses', async () => {
			const rip = await waitForRow(
				dataSource,
				`SELECT * FROM rip WHERE id = '${PRESET_2_RIP_2_ID}' AND status = 'REFUNDING'`,
			)

			expect(rip).toMatchObject({
				id: PRESET_2_RIP_2_ID,
				entries_sold: ENTRY_COUNT.toString(),
			})
		})

		it('indexes the RipCancelled with correct fields', async () => {
			const cancellation = await waitForRow(
				dataSource,
				`SELECT * FROM rip_cancelled WHERE rip_id = '${PRESET_2_RIP_2_ID}'`,
			)

			expect(cancellation).toMatchObject({
				rip_id: PRESET_2_RIP_2_ID,
				tx_hash: txHash,
			})
		})
	})

	async function buyEntries(entryCount: bigint) {
		const txHash = await walletClient.writeContract({
			...ripsAbiAndAddress,
			functionName: 'enterRip',
			args: [BigInt(PRESET_1_ID), entryCount, deployer.address],
			value: entryCount * PRESET_1_ENTRY_PRICE,
			gas: DEFAULT_GAS,
		})

		await waitForReceipt(publicClient, txHash)

		return txHash
	}

	async function buyEntriesPreset2(entryCount: bigint) {
		const txHash = await walletClient.writeContract({
			...ripsAbiAndAddress,
			functionName: 'enterRip',
			args: [BigInt(PRESET_2_ID), entryCount, deployer.address],
			value: entryCount * PRESET_2_ENTRY_PRICE,
			gas: DEFAULT_GAS,
		})

		await waitForReceipt(publicClient, txHash)

		return txHash
	}
})
