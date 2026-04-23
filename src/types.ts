import {
	CallbackGasLimitUpdated,
	Config,
	DefaultReferralFeeUpdated,
	FeeRecipientUpdated,
	PrizeClaim,
	PrizeTier,
	ProtocolFeeAccrued,
	ProtocolFeeWithdrawn,
	ReferralFeeAccrued,
	ReferralTier,
	ReferralTiersUpdated,
	ReferrerFeeSeized,
	ReferrerFeeWithdrawn,
	ReferrerFreezeUpdated,
	ReferrerStateUpdated,
	Refund,
	Round,
	Stake,
	TicketPurchase,
	VrfKeyHashUpdated,
	VrfRequestConfirmationsUpdated,
	VrfSubscriptionIdUpdated,
} from './model'
import { Block, Context, Log } from './processor'

export interface Entities {
	stakes: Map<string, Stake>
	configs: Map<string, Config>
	prizeTiers: PrizeTier[]
	rounds: Map<string, Round>
	ticketPurchases: TicketPurchase[]
	prizeClaims: PrizeClaim[]
	refunds: Refund[]
	feeRecipientUpdates: FeeRecipientUpdated[]
	callbackGasLimitUpdates: CallbackGasLimitUpdated[]
	vrfRequestConfirmationsUpdates: VrfRequestConfirmationsUpdated[]
	vrfSubscriptionIdUpdates: VrfSubscriptionIdUpdated[]
	vrfKeyHashUpdates: VrfKeyHashUpdated[]
	protocolFeeWithdrawals: ProtocolFeeWithdrawn[]
	referrerFeeWithdrawals: ReferrerFeeWithdrawn[]
	referrerFeeSeizures: ReferrerFeeSeized[]
	referrerFreezeUpdates: ReferrerFreezeUpdated[]
	referralTiersUpdates: ReferralTiersUpdated[]
	referralTiers: ReferralTier[]
	defaultReferralFeeUpdates: DefaultReferralFeeUpdated[]
	referrerStateUpdates: ReferrerStateUpdated[]
	referralFeeAccruals: ReferralFeeAccrued[]
	protocolFeeAccruals: ProtocolFeeAccrued[]
}

export interface HandlerArgs {
	ctx: Context
	entities: Entities
	block: Block
	log: Log
}
