import {
	createPublicClient,
	createWalletClient,
	decodeEventLog,
	http,
	parseEther,
	parseEventLogs,
} from 'viem'
import { mnemonicToAccount } from 'viem/accounts'
import ripsAbi from '../contracts/abi/Rips.json'
import vrfAbi from '../contracts/abi/VRFCoordinatorV2_5Mock.json'
import RipsArtifact from '../contracts/Rips.json'
import VRFMockArtifact from '../contracts/VRFCoordinatorV2_5Mock.json'
import { setNativeBalance } from './anvil'

const TEST_MNEMONIC =
	'spy record fury either collect ill pony monkey praise cool matter state'

const VRF_BASE_FEE = 100_000_000_000_000_000n
const VRF_GAS_PRICE = 1_000_000_000n
const VRF_WEI_PER_UNIT_LINK = 4_000_000_000_000_000n

const VRF_KEY_HASH: `0x${string}` =
	'0x0000000000000000000000000000000000000000000000000000000000000001'
const VRF_CALLBACK_GAS_LIMIT = 100_000
const INITIAL_FEE_PERCENT = 500n

const SUBSCRIPTION_CREATED_EVENT = {
	type: 'event',
	name: 'SubscriptionCreated',
	inputs: [
		{
			name: 'subId',
			type: 'uint256',
			indexed: true,
			internalType: 'uint256',
		},
		{
			name: 'owner',
			type: 'address',
			indexed: false,
			internalType: 'address',
		},
	],
} as const

function toHex(value: string): `0x${string}` {
	if (!value.startsWith('0x'))
		throw new Error(`Expected hex string, got: ${value}`)
	return value as `0x${string}`
}

const ripsBytecode = toHex(RipsArtifact.bytecode.object)
const vrfBytecode = toHex(VRFMockArtifact.bytecode.object)

export type SetupResult = {
	ripsAddress: `0x${string}`
	deployer: ReturnType<typeof mnemonicToAccount>
	owner: ReturnType<typeof mnemonicToAccount>
	walletClient: ReturnType<typeof createWalletClient>
	publicClient: ReturnType<typeof createPublicClient>
}

export async function setupContracts(anvilPort: number): Promise<SetupResult> {
	const rpcUrl = `http://127.0.0.1:${anvilPort}`

	// deployer and owner must be different addresses due to ConfirmedOwnerWithProposal
	// which forbids transferring ownership to self
	const deployer = mnemonicToAccount(TEST_MNEMONIC, { accountIndex: 0 })
	const owner = mnemonicToAccount(TEST_MNEMONIC, { accountIndex: 1 })

	const publicClient = createPublicClient({ transport: http(rpcUrl) })
	const walletClient = createWalletClient({ transport: http(rpcUrl) })

	await setNativeBalance(publicClient, owner.address, parseEther('10'))

	const vrfAddress = await deployVrfMock(deployer, walletClient, publicClient)
	const subscriptionId = await setupVrfSubscription(
		vrfAddress,
		deployer,
		walletClient,
		publicClient,
	)
	const ripsAddress = await deployRips(
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

	return { ripsAddress, deployer, owner, walletClient, publicClient }
}

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
