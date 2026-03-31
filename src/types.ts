import {
	CallbackGasLimitUpdated,
	FeeRecipientUpdated,
	PrizeClaim,
	PrizeTier,
	Refund,
	Round,
	Stake,
	StakeConfig,
	TicketPurchase,
} from './model'
import { Block, Context, Log } from './processor'

export interface EventContext {
	ctx: Context
	block: Block
	log: Log
	stakes: Map<string, Stake>
	stakeConfigs: Map<string, StakeConfig>
	prizeTiers: PrizeTier[]
	rounds: Map<string, Round>
	ticketPurchases: TicketPurchase[]
	prizeClaims: PrizeClaim[]
	refunds: Refund[]
	feeRecipientUpdates: FeeRecipientUpdated[]
	callbackGasLimitUpdates: CallbackGasLimitUpdated[]
	stakeConfigIdCounter: { value: number }
}
