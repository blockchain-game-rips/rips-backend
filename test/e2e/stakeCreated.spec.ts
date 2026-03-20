import { decodeEventLog, parseEther, parseEventLogs } from 'viem'
import ripsAbi from '../contracts/abi/Rips.json'
import { useAnvil } from '../utils/anvil'
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

const STAKE_CREATED_EVENT = {
	type: 'event',
	name: 'StakeCreated',
	inputs: [
		{
			name: 'stakeId',
			type: 'uint256',
			indexed: true,
			internalType: 'uint256',
		},
	],
} as const

describe('createStake', () => {
	const { anvils } = useAnvil({ chainId: CHAIN_ID })

	let setup: SetupResult

	beforeAll(async () => {
		setup = await setupContracts(anvils[0].port)
	})

	it('emits StakeCreated with stakeId 1 after creating a stake with 8 tickets', async () => {
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
