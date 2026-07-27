import {
	encodeAbiParameters,
	encodeEventTopics,
	getAddress,
	Hex,
	Log,
	TransactionReceipt,
} from 'viem'
import { parsePurchase } from '../../../../src/infrastructure/rips/parse-purchase'
import { ripsAbi } from '../../../../src/infrastructure/rips/rips-abi'

const RIPS_ADDRESS = getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
const OTHER_ADDRESS = getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
const USER_ADDRESS = getAddress('0x1111111111111111111111111111111111111111')

const RIP_ID = 42n
const ENTRY_COUNT = 3n
const START_ENTRY_INDEX = 40n

const BLOCK_HASH: Hex =
	'0x0000000000000000000000000000000000000000000000000000000000000001'
const TX_HASH: Hex =
	'0x0000000000000000000000000000000000000000000000000000000000000002'
const BLOCK_NUMBER = 1n

function toHexTopics(topics: unknown[]): [Hex, ...Hex[]] | [] {
	const hexTopics: Hex[] = []

	for (const topic of topics) {
		if (typeof topic !== 'string' || !topic.startsWith('0x')) {
			throw new Error(`Expected a hex topic, got ${String(topic)}`)
		}

		hexTopics.push(`0x${topic.slice(2)}`)
	}

	const [first, ...rest] = hexTopics

	return first === undefined ? [] : [first, ...rest]
}

function ripEnteredLog(args: {
	ripId: bigint
	user: `0x${string}`
	entryCount: bigint
	startEntryIndex: bigint
	address?: `0x${string}`
}): Log<bigint, number, false> {
	const topics = toHexTopics(
		encodeEventTopics({
			abi: ripsAbi,
			eventName: 'RipEntered',
			args: { ripId: args.ripId, user: args.user },
		}),
	)

	const data = encodeAbiParameters(
		[{ type: 'uint64' }, { type: 'uint256' }],
		[args.entryCount, args.startEntryIndex],
	)

	return {
		address: args.address ?? RIPS_ADDRESS,
		topics,
		data,
		blockHash: BLOCK_HASH,
		blockNumber: BLOCK_NUMBER,
		logIndex: 0,
		transactionHash: TX_HASH,
		transactionIndex: 0,
		removed: false,
	}
}

function receiptWithLogs(
	logs: Log<bigint, number, false>[],
): TransactionReceipt {
	return {
		logs,
		blockHash: BLOCK_HASH,
		blockNumber: BLOCK_NUMBER,
		contractAddress: null,
		cumulativeGasUsed: 0n,
		effectiveGasPrice: 0n,
		from: USER_ADDRESS,
		gasUsed: 0n,
		logsBloom: '0x',
		status: 'success',
		to: RIPS_ADDRESS,
		transactionHash: TX_HASH,
		transactionIndex: 0,
		type: 'eip1559',
	}
}

describe('parsePurchase', () => {
	it('extracts the entry range from the RipEntered event', () => {
		const receipt = receiptWithLogs([
			ripEnteredLog({
				ripId: RIP_ID,
				user: USER_ADDRESS,
				entryCount: ENTRY_COUNT,
				startEntryIndex: START_ENTRY_INDEX,
			}),
		])

		expect(parsePurchase(receipt, RIPS_ADDRESS)).toEqual({
			ripId: 42,
			entryCount: 3,
			startEntryIndex: 40,
		})
	})

	it('ignores RipEntered events from other contracts', () => {
		const receipt = receiptWithLogs([
			ripEnteredLog({
				ripId: RIP_ID,
				user: USER_ADDRESS,
				entryCount: ENTRY_COUNT,
				startEntryIndex: START_ENTRY_INDEX,
				address: OTHER_ADDRESS,
			}),
		])

		expect(parsePurchase(receipt, RIPS_ADDRESS)).toBeNull()
	})
})
