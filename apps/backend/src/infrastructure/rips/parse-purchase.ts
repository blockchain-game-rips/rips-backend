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
		.find((event) => event?.eventName === 'TicketsPurchased')

	if (!log || log.eventName !== 'TicketsPurchased') {
		return null
	}

	return {
		roundId: Number(log.args.roundId),
		ticketCount: Number(log.args.ticketCount),
	}
}
