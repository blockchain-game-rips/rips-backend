import { TypeormDatabase } from '@subsquid/typeorm-store'
import { Entity } from '@subsquid/typeorm-store/lib/store'
import * as rips from './abi/rips'
import { handleCallbackGasLimitUpdated } from './handlers/handle-callback-gas-limit-updated'
import { handleDefaultReferralFeeUpdated } from './handlers/handle-default-referral-fee-updated'
import { handleFeeRecipientUpdated } from './handlers/handle-fee-recipient-updated'
import { handlePrizesClaimed } from './handlers/handle-prizes-claimed'
import { handleProtocolFeeAccrued } from './handlers/handle-protocol-fee-accrued'
import { handleProtocolFeeWithdrawn } from './handlers/handle-protocol-fee-withdrawn'
import { handleRandomnessFulfilled } from './handlers/handle-randomness-fulfilled'
import { handleRandomnessRequested } from './handlers/handle-randomness-requested'
import { handleReferralFeeAccrued } from './handlers/handle-referral-fee-accrued'
import { handleReferralTiersUpdated } from './handlers/handle-referral-tiers-updated'
import { handleReferrerCustomFeeSet } from './handlers/handle-referrer-custom-fee-set'
import { handleReferrerFeeSeized } from './handlers/handle-referrer-fee-seized'
import { handleReferrerFeeWithdrawn } from './handlers/handle-referrer-fee-withdrawn'
import { handleReferrerFreezeUpdated } from './handlers/handle-referrer-freeze-updated'
import { handleRefundIssued } from './handlers/handle-refund-issued'
import { handleRoundCreated } from './handlers/handle-round-created'
import { handleStakeCreated } from './handlers/handle-stake-created'
import { handleStakeDeleted } from './handlers/handle-stake-deleted'
import { handleStakeUpdated } from './handlers/handle-stake-updated'
import { handleTicketsPurchased } from './handlers/handle-tickets-purchased'
import { handleVrfKeyHashUpdated } from './handlers/handle-vrf-key-hash-updated'
import { handleVrfRequestConfirmationsUpdated } from './handlers/handle-vrf-request-confirmations-updated'
import { handleVrfSubscriptionIdUpdated } from './handlers/handle-vrf-subscription-id-updated'
import { processor } from './processor'
import { Entities, HandlerArgs } from './types'

type Handler = (args: HandlerArgs) => void | Promise<void>

const handlers: Record<string, Handler> = {
	[rips.events.StakeCreated.topic]: handleStakeCreated,
	[rips.events.StakeUpdated.topic]: handleStakeUpdated,
	[rips.events.StakeDeleted.topic]: handleStakeDeleted,
	[rips.events.RoundCreated.topic]: handleRoundCreated,
	[rips.events.TicketsPurchased.topic]: handleTicketsPurchased,
	[rips.events.RandomnessRequested.topic]: handleRandomnessRequested,
	[rips.events.RandomnessFulfilled.topic]: handleRandomnessFulfilled,
	[rips.events.PrizesClaimed.topic]: handlePrizesClaimed,
	[rips.events.RefundIssued.topic]: handleRefundIssued,
	[rips.events.FeeRecipientUpdated.topic]: handleFeeRecipientUpdated,
	[rips.events.CallbackGasLimitUpdated.topic]: handleCallbackGasLimitUpdated,
	[rips.events.VrfRequestConfirmationsUpdated.topic]:
		handleVrfRequestConfirmationsUpdated,
	[rips.events.VrfSubscriptionIdUpdated.topic]:
		handleVrfSubscriptionIdUpdated,
	[rips.events.VrfKeyHashUpdated.topic]: handleVrfKeyHashUpdated,
	[rips.events.ProtocolFeeWithdrawn.topic]: handleProtocolFeeWithdrawn,
	[rips.events.ReferrerFeeWithdrawn.topic]: handleReferrerFeeWithdrawn,
	[rips.events.ReferrerFeeSeized.topic]: handleReferrerFeeSeized,
	[rips.events.ReferrerFreezeUpdated.topic]: handleReferrerFreezeUpdated,
	[rips.events.ReferralTiersUpdated.topic]: handleReferralTiersUpdated,
	[rips.events.DefaultReferralFeeUpdated.topic]:
		handleDefaultReferralFeeUpdated,
	[rips.events.ReferrerCustomFeeSet.topic]: handleReferrerCustomFeeSet,
	[rips.events.ReferralFeeAccrued.topic]: handleReferralFeeAccrued,
	[rips.events.ProtocolFeeAccrued.topic]: handleProtocolFeeAccrued,
}

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
	const entities: Entities = {
		stakes: new Map(),
		configs: new Map(),
		prizeTiers: [],
		rounds: new Map(),
		ticketPurchases: [],
		prizeClaims: [],
		refunds: [],
		feeRecipientUpdates: [],
		callbackGasLimitUpdates: [],
		vrfRequestConfirmationsUpdates: [],
		vrfSubscriptionIdUpdates: [],
		vrfKeyHashUpdates: [],
		protocolFeeWithdrawals: [],
		referrerFeeWithdrawals: [],
		referrerFeeSeizures: [],
		referrerFreezeUpdates: [],
		referralTiersUpdates: [],
		referralTiers: [],
		defaultReferralFeeUpdates: [],
		referrerCustomFeeUpdates: [],
		referralFeeAccruals: [],
		protocolFeeAccruals: [],
	}

	for (const block of ctx.blocks) {
		for (const log of block.logs) {
			const handler = handlers[log.topics[0]]

			await handler({
				ctx,
				entities,
				block: block.header,
				log,
			})
		}
	}

	for (const key of Object.keys(entities) as (keyof Entities)[]) {
		const value = entities[key]

		if (value instanceof Array) {
			await ctx.store.insert(value as Entity[])
		} else {
			await ctx.store.upsert([...(value as Map<string, Entity>).values()])
		}
	}
})
