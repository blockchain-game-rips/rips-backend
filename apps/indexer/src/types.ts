import {
	CallbackGasLimitUpdated,
	Config,
	DefaultReferralFeeUpdated,
	EntryPurchase,
	FeeRecipientUpdated,
	PayoutClaim,
	PayoutTier,
	Preset,
	ProtocolFeeAccrued,
	ProtocolFeeWithdrawn,
	ReferralFeeAccrued,
	ReferralTier,
	ReferralTiersUpdated,
	ReferrerCustomFeeUpdated,
	ReferrerFeeSeized,
	ReferrerFeeWithdrawn,
	ReferrerFreezeUpdated,
	ReferrerReward,
	ReferrerStateUpdated,
	Refund,
	Rip,
	VrfKeyHashUpdated,
	VrfRequestConfirmationsUpdated,
	VrfSubscriptionIdUpdated,
} from './model'
import { Block, Context, Log } from './processor'

export interface Entities {
	presets: Map<string, Preset>
	configs: Map<string, Config>
	payoutTiers: PayoutTier[]
	rips: Map<string, Rip>
	entryPurchases: EntryPurchase[]
	payoutClaims: PayoutClaim[]
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
	referrerCustomFeeUpdates: ReferrerCustomFeeUpdated[]
	referralFeeAccruals: ReferralFeeAccrued[]
	protocolFeeAccruals: ProtocolFeeAccrued[]
	referrerRewards: Map<string, ReferrerReward>
}

export interface HandlerArgs {
	ctx: Context
	entities: Entities
	block: Block
	log: Log
}
