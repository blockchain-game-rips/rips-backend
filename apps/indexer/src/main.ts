import { TypeormDatabase } from '@subsquid/typeorm-store'
import { Entity } from '@subsquid/typeorm-store/lib/store'
import * as rips from './abi/rips'
import { handleCallbackGasLimitUpdated } from './handlers/handle-callback-gas-limit-updated'
import { handleDefaultReferralFeeUpdated } from './handlers/handle-default-referral-fee-updated'
import { handleEntriesPurchased } from './handlers/handle-entries-purchased'
import { handleFeeRecipientUpdated } from './handlers/handle-fee-recipient-updated'
import { handlePayoutsClaimed } from './handlers/handle-payouts-claimed'
import { handlePresetCreated } from './handlers/handle-preset-created'
import { handlePresetDeleted } from './handlers/handle-preset-deleted'
import { handlePresetUpdated } from './handlers/handle-preset-updated'
import { handleProtocolFeeAccrued } from './handlers/handle-protocol-fee-accrued'
import { handleProtocolFeeWithdrawn } from './handlers/handle-protocol-fee-withdrawn'
import { handleRandomnessFulfilled } from './handlers/handle-randomness-fulfilled'
import { handleRandomnessRequested } from './handlers/handle-randomness-requested'
import { handleReferralFeeAccrued } from './handlers/handle-referral-fee-accrued'
import { handleReferralStatsUpdated } from './handlers/handle-referral-stats-updated'
import { handleReferralTiersUpdated } from './handlers/handle-referral-tiers-updated'
import { handleReferrerCustomFeeUpdated } from './handlers/handle-referrer-custom-fee-updated'
import { handleReferrerFeeSeized } from './handlers/handle-referrer-fee-seized'
import { handleReferrerFeeWithdrawn } from './handlers/handle-referrer-fee-withdrawn'
import { handleReferrerFreezeUpdated } from './handlers/handle-referrer-freeze-updated'
import { handleRefundIssued } from './handlers/handle-refund-issued'
import { handleRipCreated } from './handlers/handle-rip-created'
import { handleVrfKeyHashUpdated } from './handlers/handle-vrf-key-hash-updated'
import { handleVrfRequestConfirmationsUpdated } from './handlers/handle-vrf-request-confirmations-updated'
import { handleVrfSubscriptionIdUpdated } from './handlers/handle-vrf-subscription-id-updated'
import { Rip, RipStatus } from './model'
import { Block, Context, processor } from './processor'
import { applyStatus } from './rip-status'
import { Entities, HandlerArgs } from './types'

type Handler = (args: HandlerArgs) => void | Promise<void>

const handlers: Record<string, Handler> = {
	[rips.events.PresetCreated.topic]: handlePresetCreated,
	[rips.events.PresetUpdated.topic]: handlePresetUpdated,
	[rips.events.PresetDeleted.topic]: handlePresetDeleted,
	[rips.events.RipCreated.topic]: handleRipCreated,
	[rips.events.RipEntered.topic]: handleEntriesPurchased,
	[rips.events.RandomnessRequested.topic]: handleRandomnessRequested,
	[rips.events.RandomnessFulfilled.topic]: handleRandomnessFulfilled,
	[rips.events.PayoutClaimed.topic]: handlePayoutsClaimed,
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
	[rips.events.ReferralStateUpdated.topic]: handleReferralStatsUpdated,
	[rips.events.ReferrerCustomFeeUpdated.topic]:
		handleReferrerCustomFeeUpdated,
	[rips.events.ReferralFeeAccrued.topic]: handleReferralFeeAccrued,
	[rips.events.ProtocolFeeAccrued.topic]: handleProtocolFeeAccrued,
}

const MILLISECONDS_PER_SECOND = 1000n

async function handleFillingToRefunding(
	ctx: Context,
	entities: Entities,
	lastBlock: Block,
): Promise<void> {
	const lastBlockTimestamp = BigInt(lastBlock.timestamp)

	const fillingRips = await ctx.store.find(Rip, {
		where: { status: RipStatus.FILLING },
		relations: { config: true },
	})

	for (const rip of fillingRips) {
		const inMemoryRip = entities.rips.get(rip.id)
		const target = inMemoryRip ?? rip

		const deadlineMs =
			BigInt(target.startTime.getTime()) +
			target.config.durationSeconds * MILLISECONDS_PER_SECOND

		// The query above only saw pre-batch statuses, so a rip handlers already
		// advanced past FILLING reaches here; applyStatus rejects and logs it.
		if (
			lastBlockTimestamp >= deadlineMs &&
			applyStatus(target, RipStatus.REFUNDING, ctx)
		) {
			entities.rips.set(target.id, target)
		}
	}
}

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
	const entities: Entities = {
		presets: new Map(),
		configs: new Map(),
		payoutTiers: [],
		rips: new Map(),
		entryPurchases: [],
		payoutClaims: [],
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
		referrerStateUpdates: [],
		referrerCustomFeeUpdates: [],
		referralFeeAccruals: [],
		protocolFeeAccruals: [],
		referrerRewards: new Map(),
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

	const lastBlock = ctx.blocks[ctx.blocks.length - 1].header
	await handleFillingToRefunding(ctx, entities, lastBlock)

	for (const key of Object.keys(entities) as (keyof Entities)[]) {
		const value = entities[key]

		if (value instanceof Array) {
			await ctx.store.insert(value as Entity[])
		} else {
			await ctx.store.upsert([...(value as Map<string, Entity>).values()])
		}
	}
})
