import { ripsAbi } from '@rips/abi'
import { ANVIL_ACCOUNT_0_PRIVATE_KEY, deployments } from '@rips/test-harness'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
	createPublicClient,
	createWalletClient,
	getAddress,
	http,
	parseEventLogs,
	type Address,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const REPO_ROOT = join(__dirname, '..')
const INDEXER_ENV_FILE = join(REPO_ROOT, '.env.indexer.local')

const RPC_ENDPOINT_KEY = 'RPC_ENDPOINT'

const RIPS_ADDRESS: Address = getAddress(deployments.rips)
const VRF_COORDINATOR_ADDRESS: Address = getAddress(deployments.vrfCoordinator)

const FROM_BLOCK = 0n

const vrfCoordinatorAbi = [
	{
		type: 'function',
		name: 'fulfillRandomWords',
		inputs: [
			{ name: '_requestId', type: 'uint256' },
			{ name: '_consumer', type: 'address' },
		],
		outputs: [],
		stateMutability: 'nonpayable',
	},
] as const

async function main(): Promise<void> {
	const rpcUrl = readRpcEndpoint()

	const account = privateKeyToAccount(ANVIL_ACCOUNT_0_PRIVATE_KEY)

	const publicClient = createPublicClient({ transport: http(rpcUrl) })
	const walletClient = createWalletClient({
		account,
		transport: http(rpcUrl),
	})

	const logs = await publicClient.getLogs({
		address: RIPS_ADDRESS,
		fromBlock: FROM_BLOCK,
	})

	const pending = findPendingRequests(logs)

	if (pending.length === 0) {
		console.log('No VRF requests awaiting fulfillment.')

		return
	}

	for (const { ripId, requestId } of pending) {
		const { request } = await publicClient.simulateContract({
			account,
			address: VRF_COORDINATOR_ADDRESS,
			abi: vrfCoordinatorAbi,
			functionName: 'fulfillRandomWords',
			args: [requestId, RIPS_ADDRESS],
		})

		const hash = await walletClient.writeContract(request)

		await publicClient.waitForTransactionReceipt({ hash })

		console.log(`Filled random for rip ${ripId} (request ${requestId}).`)
	}

	console.log(`\nFulfilled ${pending.length} VRF request(s).`)
}

type PendingRequest = { ripId: bigint; requestId: bigint }

type RipsLog = Awaited<
	ReturnType<ReturnType<typeof createPublicClient>['getLogs']>
>[number]

function findPendingRequests(logs: RipsLog[]): PendingRequest[] {
	const requested = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessRequested',
		logs,
	})

	const fulfilled = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessFulfilled',
		logs,
	})

	const fulfilledRipIds = new Set(fulfilled.map((log) => log.args.ripId))

	return requested
		.filter((log) => !fulfilledRipIds.has(log.args.ripId))
		.map((log) => ({
			ripId: log.args.ripId,
			requestId: log.args.vrfRequestId,
		}))
}

function readRpcEndpoint(): string {
	const contents = readFileSync(INDEXER_ENV_FILE, 'utf-8')

	for (const line of contents.split('\n')) {
		const [key, ...rest] = line.split('=')

		if (key === RPC_ENDPOINT_KEY) {
			return rest.join('=').trim()
		}
	}

	throw new Error(
		`${RPC_ENDPOINT_KEY} not found in ${INDEXER_ENV_FILE}. Run "yarn dev:up" first.`,
	)
}

void main().catch((error) => {
	console.error(error)

	process.exit(1)
})
