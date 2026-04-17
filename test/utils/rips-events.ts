import { parseEventLogs, type TransactionReceipt } from 'viem'
import { ripsAbi } from '../../src/infrastructure/rips/rips-abi'

export function parseRandomnessFulfilled(logs: TransactionReceipt['logs']): {
	randomA: bigint
	randomB: bigint
} {
	const [log] = parseEventLogs({
		abi: ripsAbi,
		eventName: 'RandomnessFulfilled',
		logs,
	})
	return { randomA: log.args.randomA, randomB: log.args.randomB }
}
