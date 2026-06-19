import { decodeEventLog, getAddress, TransactionReceipt } from 'viem'
import { Purchase } from '../../domain/value-objects/purchase'
import { ripsAbi } from './rips-abi'

export function parsePurchase(
	receipt: TransactionReceipt,
	ripsContractAddress: string,
): Purchase | null {
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
		.find((event) => event?.eventName === 'RipEntered')

	if (!log || log.eventName !== 'RipEntered') {
		return null
	}

	return {
		ripId: Number(log.args.ripId),
		entryCount: Number(log.args.entryCount),
	}
}
