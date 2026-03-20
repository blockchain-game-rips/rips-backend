import {
	createPublicClient,
	createWalletClient,
	decodeEventLog,
	http,
	parseEther,
	parseEventLogs,
} from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import { setNativeBalance, useAnvil } from '../utils/anvil'
import RipsArtifact from '../Rips.json'
import VRFMockArtifact from '../VRFCoordinatorV2_5Mock.json'

const TEST_MNEMONIC =
	'spy record fury either collect ill pony monkey praise cool matter state'

const CHAIN_ID = 31337

const VRF_BASE_FEE = 100_000_000_000_000_000n
const VRF_GAS_PRICE = 1_000_000_000n
const VRF_WEI_PER_UNIT_LINK = 4_000_000_000_000_000n

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

const ripsAbi = RipsArtifact.abi
const vrfAbi = VRFMockArtifact.abi

const STAKE_CREATED_EVENT = {
	type: 'event',
	name: 'StakeCreated',
	inputs: [{ name: 'stakeId', type: 'uint256', indexed: true, internalType: 'uint256' }],
} as const

const SUBSCRIPTION_CREATED_EVENT = {
	type: 'event',
	name: 'SubscriptionCreated',
	inputs: [
		{ name: 'subId', type: 'uint256', indexed: true, internalType: 'uint256' },
		{ name: 'owner', type: 'address', indexed: false, internalType: 'address' },
	],
} as const

function toHex(value: string): `0x${string}` {
	if (!value.startsWith('0x')) throw new Error(`Expected hex string, got: ${value}`)
	return value as `0x${string}`
}

const ripsBytecode = toHex(RipsArtifact.bytecode.object)
const vrfBytecode = toHex(VRFMockArtifact.bytecode.object)

async function deployVrfMock(
	account: ReturnType<typeof mnemonicToAccount>,
	walletClient: ReturnType<typeof createWalletClient>,
	publicClient: ReturnType<typeof createPublicClient>,
) {
	const hash = await walletClient.deployContract({
		abi: vrfAbi,
		bytecode: vrfBytecode,
		args: [VRF_BASE_FEE, VRF_GAS_PRICE, VRF_WEI_PER_UNIT_LINK],
		account,
		chain: null,
	})
	const receipt = await publicClient.waitForTransactionReceipt({ hash })

	if (!receipt.contractAddress) throw new Error('VRF mock deployment failed')

	return receipt.contractAddress
}

async function setupVrfSubscription(
	vrfAddress: `0x${string}`,
	account: ReturnType<typeof mnemonicToAccount>,
	walletClient: ReturnType<typeof createWalletClient>,
	publicClient: ReturnType<typeof createPublicClient>,
) {
	const hash = await walletClient.writeContract({
		address: vrfAddress,
		abi: vrfAbi,
		functionName: 'createSubscription',
		args: [],
		account,
		chain: null,
	})
	const receipt = await publicClient.waitForTransactionReceipt({ hash })

	const [rawLog] = parseEventLogs({
		abi: vrfAbi,
		logs: receipt.logs,
		eventName: 'SubscriptionCreated',
	})
	const { args } = decodeEventLog({
		abi: [SUBSCRIPTION_CREATED_EVENT],
		eventName: 'SubscriptionCreated',
		topics: rawLog.topics,
		data: rawLog.data,
	})

	const subscriptionId: bigint = args.subId

	await walletClient.writeContract({
		address: vrfAddress,
		abi: vrfAbi,
		functionName: 'fundSubscription',
		args: [subscriptionId, parseEther('10')],
		account,
		chain: null,
	})

	return subscriptionId
}

async function deployRips(
	vrfAddress: `0x${string}`,
	subscriptionId: bigint,
	ownerAddress: `0x${string}`,
	account: ReturnType<typeof mnemonicToAccount>,
	walletClient: ReturnType<typeof createWalletClient>,
	publicClient: ReturnType<typeof createPublicClient>,
) {
	const VRF_KEY_HASH: `0x${string}` =
		'0x0000000000000000000000000000000000000000000000000000000000000001'
	const VRF_CALLBACK_GAS_LIMIT = 100_000
	const INITIAL_FEE_PERCENT = 500n

	const hash = await walletClient.deployContract({
		abi: ripsAbi,
		bytecode: ripsBytecode,
		args: [
			vrfAddress,
			subscriptionId,
			VRF_KEY_HASH,
			VRF_CALLBACK_GAS_LIMIT,
			ownerAddress,
			INITIAL_FEE_PERCENT,
		],
		account,
		chain: null,
	})
	const receipt = await publicClient.waitForTransactionReceipt({ hash })

	if (!receipt.contractAddress) throw new Error('Rips deployment failed')

	return receipt.contractAddress
}

describe('createStake', () => {
	const { anvils } = useAnvil({ chainId: CHAIN_ID })

	let ripsAddress: `0x${string}`
	let deployer: ReturnType<typeof mnemonicToAccount>
	let owner: ReturnType<typeof mnemonicToAccount>
	let walletClient: ReturnType<typeof createWalletClient>
	let publicClient: ReturnType<typeof createPublicClient>

	beforeAll(async () => {
		const anvil = anvils[0]
		const rpcUrl = `http://127.0.0.1:${anvil.port}`

		// deployer and owner must be different addresses due to ConfirmedOwnerWithProposal
		// which forbids transferring ownership to self
		deployer = mnemonicToAccount(TEST_MNEMONIC, { accountIndex: 0 })
		owner = mnemonicToAccount(TEST_MNEMONIC, { accountIndex: 1 })

		publicClient = createPublicClient({ transport: http(rpcUrl) })
		walletClient = createWalletClient({ transport: http(rpcUrl) })

		await setNativeBalance(publicClient, owner.address, parseEther('10'))

		const vrfAddress = await deployVrfMock(deployer, walletClient, publicClient)
		const subscriptionId = await setupVrfSubscription(
			vrfAddress,
			deployer,
			walletClient,
			publicClient,
		)

		ripsAddress = await deployRips(
			vrfAddress,
			subscriptionId,
			owner.address,
			deployer,
			walletClient,
			publicClient,
		)

		await walletClient.writeContract({
			address: vrfAddress,
			abi: vrfAbi,
			functionName: 'addConsumer',
			args: [subscriptionId, ripsAddress],
			account: deployer,
			chain: null,
		})

		await walletClient.writeContract({
			address: ripsAddress,
			abi: ripsAbi,
			functionName: 'acceptOwnership',
			args: [],
			account: owner,
			chain: null,
		})
	})

	it('emits StakeCreated with stakeId 0 after creating a stake with 8 tickets', async () => {
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
		const receipt = await publicClient.waitForTransactionReceipt({ hash })

		const [rawLog] = parseEventLogs({
			abi: ripsAbi,
			logs: receipt.logs,
			eventName: 'StakeCreated',
		})
		const { args } = decodeEventLog({
			abi: [STAKE_CREATED_EVENT],
			eventName: 'StakeCreated',
			topics: rawLog.topics,
			data: rawLog.data,
		})

		expect(args.stakeId).toBe(1n)
	})
})
