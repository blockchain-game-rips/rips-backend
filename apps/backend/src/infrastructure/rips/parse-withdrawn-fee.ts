import { decodeEventLog, getAddress, TransactionReceipt } from 'viem'
import { ripsAbi } from './rips-abi'

export function parseWithdrawnFee(
	receipt: TransactionReceipt,
	ripsContractAddress: string,
): bigint | null {
	const ripsAddress = getAddress(ripsContractAddress)

	const log = receipt.logs
		.filter((l) => getAddress(l.address) === ripsAddress)
		.map((l) => {
			try {
				return decodeEventLog({ abi: ripsAbi, ...l, strict: true })
			} catch {
				return null
			}
		})
		.find((event) => event?.eventName === 'ReferrerFeeWithdrawn')

	if (!log || log.eventName !== 'ReferrerFeeWithdrawn') {
		return null
	}

	return log.args.amount
}
