import { Card } from './card'
import { EvmAddress } from './evm-address'

export type EntryPayout = {
	ripId: number
	userAddress: EvmAddress
	entryNumber: number
	payoutAmount: bigint
	revealed: boolean
	card: Card
}
